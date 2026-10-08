<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Opportunity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class OpportunityController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->opportunities()->orderByDesc('score');

        if ($request->boolean('bookmarked')) {
            $query->where('is_bookmarked', true);
        }

        if ($request->filled('search')) {
            $query->where('title', 'like', '%'.$request->string('search').'%');
        }

        return $query->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'app_id' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'developer' => 'nullable|string|max:255',
            'icon_url' => 'nullable|url',
            'rating' => 'nullable|numeric|min:0|max:5',
            'installs' => 'nullable|string|max:50',
            'score' => 'nullable|numeric',
            'category' => 'nullable|string|max:255',
            'summary' => 'nullable|string',
            'url' => 'nullable|url',
        ]);

        $opportunity = $request->user()->opportunities()->updateOrCreate(
            ['app_id' => $data['app_id']],
            $data
        );

        return response()->json($opportunity, 201);
    }

    public function show(Request $request, Opportunity $opportunity)
    {
        Gate::authorize('view', $opportunity);

        return response()->json($opportunity->load('analyses'));
    }

    public function update(Request $request, Opportunity $opportunity)
    {
        Gate::authorize('update', $opportunity);

        $data = $request->validate([
            'is_bookmarked' => 'sometimes|boolean',
            'summary' => 'sometimes|nullable|string',
        ]);

        $opportunity->update($data);

        return response()->json($opportunity);
    }

    public function destroy(Request $request, Opportunity $opportunity)
    {
        Gate::authorize('delete', $opportunity);

        $opportunity->delete();

        return response()->json(null, 204);
    }
}
