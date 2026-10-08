<?php

use App\Jobs\RunScanJob;
use App\Models\ScanJob;
use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Run a keyword scan immediately:  php artisan scan:run "habit tracker" --email=you@example.com
Artisan::command('scan:run {keyword} {--email=}', function () {
    $user = $this->option('email')
        ? User::where('email', $this->option('email'))->firstOrFail()
        : User::firstOrFail();

    $scan = ScanJob::create([
        'user_id' => $user->id,
        'keyword' => $this->argument('keyword'),
        'status' => ScanJob::STATUS_PENDING,
    ]);

    RunScanJob::dispatch($scan->id);

    $this->info("Scan #{$scan->id} queued for '{$scan->keyword}'.");
})->purpose('Queue a Play Store keyword scan');

// Example: re-run a daily scan for a tracked keyword.
// Uncomment and set a real keyword + user, then add the scheduler cron:
//   * * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
// Schedule::command('scan:run "habit tracker" --email=you@example.com')->dailyAt('06:00');
