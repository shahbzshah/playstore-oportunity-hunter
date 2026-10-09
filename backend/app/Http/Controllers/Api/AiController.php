<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Analysis;
use App\Models\Opportunity;
use App\Services\PythonServiceClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AiController extends Controller
{
    public function analyze(Request $request, string $appId, PythonServiceClient $client)
    {
        $data = $request->validate([
            'opportunity_id' => 'sometimes|exists:opportunities,id',
        ]);

        try {
            $result = $client->analyze($appId);
        } catch (\Throwable $e) {
            Log::warning('AI analysis failed', ['app_id' => $appId, 'error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Analysis service unavailable: '.$e->getMessage(),
            ], 502);
        }

        $opportunityId = $data['opportunity_id'] ?? null;
        if (! $opportunityId) {
            $opportunityId = Opportunity::where('user_id', $request->user()->id)
                ->where('app_id', $appId)
                ->value('id');
        }

        $analysis = Analysis::create([
            'user_id' => $request->user()->id,
            'opportunity_id' => $opportunityId,
            'app_id' => $appId,
            'provider' => $result['provider'] ?? 'unknown',
            'content' => is_string($result['analysis'] ?? null)
                ? $result['analysis']
                : json_encode($result['analysis'] ?? $result),
        ]);

        return response()->json($analysis, 201);
    }

    public function destroy(Request $request, int $id)
    {
        $analysis = Analysis::where('user_id', $request->user()->id)->findOrFail($id);
        $analysis->delete();

        return response()->noContent();
    }
}
