<?php

namespace App\Policies;

use App\Models\ScanJob;
use App\Models\User;

class ScanJobPolicy
{
    public function view(User $user, ScanJob $scanJob): bool
    {
        return $scanJob->user_id === $user->id;
    }
}
