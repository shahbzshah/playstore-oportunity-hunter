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
     */
    public function scan(string $keyword, int $limit = 20): array
    {
        return $this->client()
            ->post('/scan', ['keyword' => $keyword, 'limit' => $limit])
            ->throw()
            ->json();
    }

    public function getApp(string $appId): array
    {
        return $this->client()->get("/app/{$appId}")->throw()->json();
    }

    public function analyze(string $appId): array
    {
        return $this->client()->post("/analyze/{$appId}")->throw()->json();
    }
}
