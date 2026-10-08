<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class PythonServiceClient
{
    protected string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.python.url', 'http://127.0.0.1:8000'), '/');
    }

    protected function client()
    {
        return Http::baseUrl($this->baseUrl)
            ->timeout(120)
            ->acceptJson();
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
