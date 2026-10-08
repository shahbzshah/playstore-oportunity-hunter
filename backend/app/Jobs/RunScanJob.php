<?php

namespace App\Jobs;

use App\Models\Opportunity;
use App\Models\ScanJob;
use App\Services\PythonServiceClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class RunScanJob implements ShouldQueue
{
    use Queueable;

    public int $timeout = 600;

    public function __construct(public int $scanJobId) {}

    public function handle(PythonServiceClient $client): void
    {
        $scan = ScanJob::find($this->scanJobId);
        if (! $scan) {
            return;
        }

        $scan->update([
            'status' => ScanJob::STATUS_RUNNING,
            'started_at' => now(),
            'error' => null,
        ]);

        try {
            $response = $client->scan($scan->keyword);
            $results = $response['opportunities'] ?? $response['results'] ?? [];

            foreach ($results as $app) {
                $appId = $app['appId'] ?? $app['app_id'] ?? '';
                Opportunity::updateOrCreate(
                    ['user_id' => $scan->user_id, 'app_id' => $appId],
                    [
                        'title' => $app['title'] ?? $appId ?: 'Unknown',
                        'developer' => $app['developer'] ?? null,
                        'icon_url' => $app['icon'] ?? null,
                        'rating' => $app['rating'] ?? null,
                        'installs' => $app['installs'] ?? null,
                        'reviews_count' => $app['reviews'] ?? null,
                        'score' => $app['opportunity'] ?? 0,
                        'category' => $app['genre'] ?? null,
                        'url' => $appId ? "https://play.google.com/store/apps/details?id={$appId}" : null,
                    ]
                );
            }

            $scan->update([
                'status' => ScanJob::STATUS_COMPLETED,
                'results_count' => count($results),
                'finished_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Scan job failed', ['scan_job_id' => $scan->id, 'error' => $e->getMessage()]);
            $scan->update([
                'status' => ScanJob::STATUS_FAILED,
                'error' => $e->getMessage(),
                'finished_at' => now(),
            ]);
        }
    }
}
