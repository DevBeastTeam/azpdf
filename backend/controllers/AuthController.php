<?php
// backend/controllers/AuthController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

class AuthController {
    public static function login(): void {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $email = trim($input['email'] ?? '');
            $password = $input['password'] ?? '';

            if (!$email || !$password) {
                Response::error('Email and password are required.', 400);
            }

            $cleanEmail = strtolower($email);
            $users = Database::query('SELECT * FROM users WHERE LOWER(email) = ?', [$cleanEmail]);

            if (!empty($users)) {
                $user = $users[0];
                if (!empty($user['password']) && $user['password'] !== $password) {
                    Response::error('Incorrect password. Please check and try again.', 401);
                }

                unset($user['password']);
                Response::json([
                    'success' => true,
                    'message' => 'Login successful!',
                    'user' => $user
                ]);
            }

            Response::error('No account found with this email. Please sign up.', 404);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function signup(): void {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $email = trim($input['email'] ?? '');
            $password = $input['password'] ?? '';
            $name = trim($input['name'] ?? '');
            $plan = $input['plan'] ?? 'FREE';

            if (!$email || !$password) {
                Response::error('Email and password are required.', 400);
            }

            $cleanEmail = strtolower($email);
            $existing = Database::query('SELECT * FROM users WHERE LOWER(email) = ?', [$cleanEmail]);

            if (!empty($existing)) {
                Response::error('An account with this email already exists. Please log in.', 400);
            }

            $trimmedName = $name ?: explode('@', $cleanEmail)[0];
            $userId = (int) (microtime(true) * 1000);
            $joinDate = date('Y-m-d');
            $avatar = strtoupper($trimmedName ? $trimmedName[0] : 'U');

            Database::run(
                'INSERT INTO users (id, name, email, password, plan, joinDate, status, files, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [$userId, $trimmedName, $cleanEmail, $password, $plan, $joinDate, 'Active', 0, $avatar]
            );

            Response::json([
                'success' => true,
                'message' => 'Account created successfully!',
                'user' => [
                    'id' => $userId,
                    'name' => $trimmedName,
                    'email' => $cleanEmail,
                    'plan' => $plan,
                    'joinDate' => $joinDate,
                    'status' => 'Active',
                    'files' => 0,
                    'avatar' => $avatar
                ]
            ]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }
}
