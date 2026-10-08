<?php

namespace Tests\Feature;

use App\Jobs\RunScanJob;
use App\Models\Opportunity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ScanAndOpportunityTest extends TestCase
{
    use RefreshDatabase;

    protected function authHeaders(User $user): array
    {
        return ['Authorization' => 'Bearer '.$user->createToken('api')->plainTextToken];
    }

    public function test_creating_a_scan_dispatches_job(): void
    {
        Queue::fake();
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeaders($user))
            ->postJson('/api/v1/scans', ['keyword' => 'habit tracker']);

        $response->assertStatus(202)
            ->assertJson(['keyword' => 'habit tracker', 'status' => 'pending']);

        Queue::assertPushed(RunScanJob::class);
        $this->assertDatabaseHas('scan_jobs', ['keyword' => 'habit tracker', 'user_id' => $user->id]);
    }

    public function test_scan_requires_keyword(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeaders($user))
            ->postJson('/api/v1/scans', [])
            ->assertStatus(422);
    }

    public function test_users_only_see_their_own_scans_and_opportunities(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $scan = $alice->scanJobs()->create(['keyword' => 'fitness', 'status' => 'completed']);
        $opp = $alice->opportunities()->create([
            'app_id' => 'com.example.app', 'title' => 'Example', 'score' => 90,
        ]);

        // Bob cannot see Alice's scan
        $this->withHeaders($this->authHeaders($bob))
            ->getJson("/api/v1/scans/{$scan->id}")
            ->assertForbidden();

        // Bob cannot see Alice's opportunity
        $this->withHeaders($this->authHeaders($bob))
            ->getJson("/api/v1/opportunities/{$opp->id}")
            ->assertForbidden();

        // Bob's own list is empty
        $this->withHeaders($this->authHeaders($bob))
            ->getJson('/api/v1/opportunities')
            ->assertOk()
            ->assertJson(['total' => 0]);
    }

    public function test_user_can_bookmark_and_filter_opportunities(): void
    {
        $user = User::factory()->create();
        $opp = $user->opportunities()->create([
            'app_id' => 'com.example.app', 'title' => 'Example', 'score' => 90,
        ]);

        $this->withHeaders($this->authHeaders($user))
            ->patchJson("/api/v1/opportunities/{$opp->id}", ['is_bookmarked' => true])
            ->assertOk()
            ->assertJson(['is_bookmarked' => true]);

        $this->withHeaders($this->authHeaders($user))
            ->getJson('/api/v1/opportunities?bookmarked=1')
            ->assertOk()
            ->assertJson(['total' => 1]);
    }

    public function test_opportunity_list_is_ordered_by_score(): void
    {
        $user = User::factory()->create();
        $user->opportunities()->create(['app_id' => 'a', 'title' => 'Low', 'score' => 10]);
        $user->opportunities()->create(['app_id' => 'b', 'title' => 'High', 'score' => 95]);

        $response = $this->withHeaders($this->authHeaders($user))
            ->getJson('/api/v1/opportunities');

        $response->assertOk();
        $this->assertSame('High', $response->json('data.0.title'));
        $this->assertSame('Low', $response->json('data.1.title'));
    }
}
