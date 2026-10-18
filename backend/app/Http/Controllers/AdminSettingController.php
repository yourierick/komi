<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AdminSettingController extends Controller
{
    public function show()
    {
        return response()->json(['data' => Setting::snapshot()]);
    }

    public function update(Request $request)
    {
        $payload = $request->all();
        $unknown = array_diff(array_keys($payload), array_keys(Setting::SCHEMA));

        if ($unknown) {
            throw ValidationException::withMessages(
                collect($unknown)->mapWithKeys(
                    fn ($key) => [$key => "Paramètre inconnu : {$key}"],
                )->all(),
            );
        }

        $rules = [];
        foreach (array_keys($payload) as $key) {
            $meta = Setting::SCHEMA[$key];
            $rules[$key] = $meta['rules'];
            if ($meta['type'] === 'array') {
                $rules["{$key}.*"] = $meta['element_rules'];
            }
        }

        $validated = $request->validate($rules);

        if (
            array_key_exists('payment_methods_enabled', $validated)
            && !in_array(Setting::MANDATORY_PAYMENT_METHOD, $validated['payment_methods_enabled'])
        ) {
            throw ValidationException::withMessages([
                'payment_methods_enabled' => 'Le paiement protégé par Komi ne peut pas être désactivé.',
            ]);
        }

        foreach ($validated as $key => $value) {
            Setting::set($key, $value);
        }

        return response()->json(['data' => Setting::snapshot()]);
    }
}
