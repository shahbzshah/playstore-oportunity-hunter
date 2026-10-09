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

    protected function client()
    {
        // Free-tier hosts sleep when idle; the first call can take a minute
        // to wake the service, so the timeout is generous (overridable).
        return Http::baseUrl($this->baseUrl)
            ->timeout((int) config('services.python.timeout', 300))
            ->acceptJson();
    }

    /**
     * Client with retries for Render's proxy 502/503/504s and connection
     * drops while the free-tier Python service wakes from sleep.
     */
    protected function resilientClient()
    {
        return $this->client()->retry(5, 15000, function ($exception) {
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
     * Cheap call that wakes the Python service before a long scan, so the
     * cold start doesn't eat into the scan request's own timeout.
     */
    public function wake(): void
    {
        try {
            $this->health();
        } catch (\Throwable $e) {
            Log::debug('Python service wake-up ping failed', ['error' => $e->getMessage()]);
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
