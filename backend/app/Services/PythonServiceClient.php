<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PythonServiceClient
{
    protected string $baseUrl;

    public function __construct()
    {
        $url = rtrim(config('services.python.url', 'http://127.0.0.1:8000'), '/');
        // Render's fromService "host" property has no scheme; assume https.
        if (! preg_match('#^https?://#i', $url)) {
            $url = 'https://'.$url;
        }
        $this->baseUrl = $url;
    }

    protected function client(?int $timeout = null)
    {
        // Free-tier hosts sleep when idle; the first call can take a minute
        // to wake the service, so the timeout is generous (overridable).
        return Http::baseUrl($this->baseUrl)
            ->timeout($timeout ?? (int) config('services.python.timeout', 300))
            ->acceptJson();
    }

    /**
     * Client with retries for Render's proxy 502/503/504s and connection
     * drops while the free-tier Python service wakes from sleep.
     */
    protected function resilientClient()
    {
        return $this->client()->retry(8, 15000, function ($exception) {
            if ($exception instanceof \Illuminate\Http\Client\ConnectionException) {
                return true;
            }
            $response = $exception instanceof \Illuminate\Http\Client\RequestException
                ? $exception->response
                : null;

            return $response && in_array($response->status(), [502, 503, 504]);
        });
    }

    /**
     * Block until the Python service answers /health, absorbing the full
     * free-tier cold boot (which can take minutes — far longer than a few
     * request retries). Gives up after $maxSeconds and lets the caller fail
     * with a clear state instead of hanging the queue worker.
     */
    public function wake(int $maxSeconds = 300): void
    {
        $deadline = time() + $maxSeconds;
        $attempts = 0;
        while (true) {
            $attempts++;
            try {
                $this->client(30)->get('/health')->throw()->json();
                if ($attempts > 1) {
                    Log::info('Python service woke after cold start', ['attempts' => $attempts]);
                }

                return;
            } catch (\Throwable $e) {
                if (time() >= $deadline) {
                    Log::warning('Python service did not wake in time', [
                        'attempts' => $attempts,
                        'error' => substr($e->getMessage(), 0, 200),
                    ]);

                    return;
                }
                sleep(10);
            }
        }
    }

    public function health(): array
    {
        return $this->client()->get('/health')->throw()->json();
    }

    /**
     * Run a keyword scan. Returns the decoded response with `results`.
     *
     * NOTE: ->throw() must be on the pending request (not the response)
     * for ->retry() to catch HTTP errors and actually retry.
     */
    public function scan(string $keyword, int $limit = 20): array
    {
        return $this->resilientClient()
            ->throw()
            ->post('/scan', ['keyword' => $keyword, 'limit' => $limit])
            ->json();
    }

    public function getApp(string $appId): array
    {
        return $this->client()->get("/app/{$appId}")->throw()->json();
    }

    public function analyze(string $appId): array
    {
        return $this->resilientClient()->throw()->post("/analyze/{$appId}")->json();
    }
}
