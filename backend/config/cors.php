<?php

return [
    /*
    | CORS for the React frontend. Set FRONTEND_URL on the host
    | (comma-separated for multiple origins), e.g.
    | https://oph-frontend.onrender.com
    */
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('FRONTEND_URL', ''))
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
