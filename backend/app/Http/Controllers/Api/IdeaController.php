<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PythonServiceClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Trending app ideas (Reddit + Google Trends via the Python service).
 * The feed is cached for 6 hours — ideas don't change by the minute and
 * the upstream sources are rate-limited.
 */
class IdeaController extends Controller
{
    public function index(PythonServiceClient $client)
    {
        $ideas = Cache::remember('ideas.feed', now()->addHours(6), function () use ($client) {
            try {
                return $client->ideas();
            } catch (\Throwable $e) {
                Log::warning('Ideas feed fetch failed', ['error' => $e->getMessage()]);
                return ['count' => 0, 'ideas' => []];
            }
        });

        return response()->json($ideas);
    }

    public function analyze(Request $request, PythonServiceClient $client)
    {
        $data = $request->validate([
            'title' => 'required|string|min:3|max:300',
            'source' => 'sometimes|string|max:100',
            'context' => 'sometimes|string|max:2000',
        ]);

        try {
            $result = $client->analyzeIdea(
                $data['title'],
                $data['source'] ?? 'unknown',
                $data['context'] ?? ''
            );
        } catch (\Throwable $e) {
            Log::error('Idea analysis failed', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'AI analysis failed: ' . $e->getMessage()], 502);
        }

        return response()->json($result);
    }
}
