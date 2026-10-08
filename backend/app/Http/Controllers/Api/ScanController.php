<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\RunScanJob;
use App\Models\ScanJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ScanController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->scanJobs()->latest()->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'keyword' => 'required|string|max:255',
            'limit' => 'sometimes|integer|min:1|max:50',
        ]);

        $scan = ScanJob::create([
            'user_id' => $request->user()->id,
            'keyword' => $data['keyword'],
            'status' => ScanJob::STATUS_PENDING,
        ]);

        RunScanJob::dispatch($scan->id);

        return response()->json($scan, 202);
    }

    public function show(Request $request, ScanJob $scan)
    {
        Gate::authorize('view', $scan);

        return response()->json($scan);
    }
}
