<?php
// backend/controllers/BlogController.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

class BlogController {
    public static function getAll(): void {
        try {
            $blogs = Database::query('SELECT * FROM blogs ORDER BY id DESC');
            Response::json([
                'success' => true,
                'blogs' => $blogs,
                'count' => count($blogs)
            ]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function getBySlug(string|int $slugOrId): void {
        try {
            $rows = Database::query(
                'SELECT * FROM blogs WHERE slug = ? OR id = ? LIMIT 1',
                [(string) $slugOrId, is_numeric($slugOrId) ? (int) $slugOrId : -1]
            );

            if (empty($rows)) {
                Response::error('Article not found', 404);
            }

            Response::json([
                'success' => true,
                'blog' => $rows[0]
            ]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function create(): void {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $title = trim($input['title'] ?? '');
            if (!$title) {
                Response::error('Article title is required.', 400);
            }

            $content = trim($input['content'] ?? ($input['body'] ?? ''));
            if (!$content) {
                Response::error('Article content is required.', 400);
            }

            $rawSlug = trim($input['slug'] ?? '');
            $slug = $rawSlug ? self::slugify($rawSlug) : self::slugify($title);

            // Ensure unique slug
            $existing = Database::query('SELECT id FROM blogs WHERE slug = ?', [$slug]);
            if (!empty($existing)) {
                $slug .= '-' . time();
            }

            $excerpt = trim($input['excerpt'] ?? ($input['summary'] ?? ''));
            if (!$excerpt) {
                $excerpt = substr(strip_tags($content), 0, 160) . '...';
            }

            $category = trim($input['category'] ?? 'Tutorials');
            $author = trim($input['author'] ?? 'Technical Team');
            $image = trim($input['image'] ?? 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80');
            $readTime = trim($input['read_time'] ?? ($input['readTime'] ?? '4 min read'));
            $tags = trim($input['tags'] ?? 'PDF, Guide');
            $status = trim($input['status'] ?? 'Published');
            $now = date('Y-m-d H:i:s');

            $db = Database::getConnection();
            $stmt = $db->prepare('INSERT INTO blogs (title, slug, excerpt, content, category, author, image, read_time, tags, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([$title, $slug, $excerpt, $content, $category, $author, $image, $readTime, $tags, $status, $now, $now]);
            $newId = (int) $db->lastInsertId();

            $created = Database::query('SELECT * FROM blogs WHERE id = ?', [$newId]);
            self::syncJson();

            Response::json([
                'success' => true,
                'message' => 'Article created successfully!',
                'blog' => $created[0] ?? null
            ]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function update(int $id): void {
        try {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $existing = Database::query('SELECT * FROM blogs WHERE id = ?', [$id]);
            if (empty($existing)) {
                Response::error('Article not found', 404);
            }
            $current = $existing[0];

            $title = trim($input['title'] ?? $current['title']);
            $rawSlug = trim($input['slug'] ?? $current['slug']);
            $slug = self::slugify($rawSlug ?: $title);

            // Ensure unique slug except self
            $slugCheck = Database::query('SELECT id FROM blogs WHERE slug = ? AND id != ?', [$slug, $id]);
            if (!empty($slugCheck)) {
                $slug .= '-' . time();
            }

            $content = trim($input['content'] ?? ($input['body'] ?? $current['content']));
            $excerpt = trim($input['excerpt'] ?? ($input['summary'] ?? $current['excerpt']));
            $category = trim($input['category'] ?? $current['category']);
            $author = trim($input['author'] ?? $current['author']);
            $image = trim($input['image'] ?? $current['image']);
            $readTime = trim($input['read_time'] ?? ($input['readTime'] ?? $current['read_time']));
            $tags = trim($input['tags'] ?? $current['tags']);
            $status = trim($input['status'] ?? $current['status']);
            $now = date('Y-m-d H:i:s');

            Database::run(
                'UPDATE blogs SET title = ?, slug = ?, excerpt = ?, content = ?, category = ?, author = ?, image = ?, read_time = ?, tags = ?, status = ?, updated_at = ? WHERE id = ?',
                [$title, $slug, $excerpt, $content, $category, $author, $image, $readTime, $tags, $status, $now, $id]
            );

            $updated = Database::query('SELECT * FROM blogs WHERE id = ?', [$id]);
            self::syncJson();

            Response::json([
                'success' => true,
                'message' => 'Article updated successfully!',
                'blog' => $updated[0] ?? null
            ]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    public static function delete(int $id): void {
        try {
            Database::run('DELETE FROM blogs WHERE id = ?', [$id]);
            self::syncJson();

            Response::json([
                'success' => true,
                'message' => 'Article deleted successfully!'
            ]);
        } catch (Throwable $e) {
            Response::error($e->getMessage(), 500);
        }
    }

    private static function slugify(string $text): string {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);
        $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
        $text = preg_replace('~[^-\w]+~', '', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        $text = strtolower($text);
        return $text ?: 'article-' . time();
    }

    private static function syncJson(): void {
        try {
            $jsonDbPath = __DIR__ . '/../db.json';
            if (file_exists($jsonDbPath)) {
                $all = Database::query('SELECT * FROM blogs ORDER BY id DESC');
                $data = json_decode(file_get_contents($jsonDbPath), true) ?? [];
                $data['blogs'] = $all;
                file_put_contents($jsonDbPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            }
        } catch (Throwable $e) {
            // Ignore background sync errors
        }
    }
}
