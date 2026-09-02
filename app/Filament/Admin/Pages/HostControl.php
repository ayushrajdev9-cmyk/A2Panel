<?php

namespace App\Filament\Admin\Pages;

use App\Enums\ContainerStatus;
use App\Enums\TablerIcon;
use App\Models\Node;
use App\Models\Server;
use App\Repositories\Daemon\DaemonServerRepository;
use BackedEnum;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

class HostControl extends Page
{
    protected static string | BackedEnum | null $navigationIcon = TablerIcon::Server2;

    protected string $view = 'filament.admin.pages.host-control';

    // Public properties are required for Livewire/Blade access
    public array $nodes = [];

    public array $selectedNode = [];

    public string $command = '';

    public string $consoleOutput = '';

    /**
     * Run a shell command on this host (panel + node share the same machine).
     * Restricted to root admins via HostControl::canAccess().
     */
    public function runCommand(): void
    {
        $this->consoleOutput = '';
        $command = trim($this->command);

        if ($command === '') {
            $this->consoleOutput = '$ (empty command)';
            return;
        }

        if (in_array($command, ['clear', 'cls'], true)) {
            $this->consoleOutput = '';
            $this->command = '';
            return;
        }

        $output = null;
        $exit = null;
        exec($command . ' 2>&1', $output, $exit);

        $this->consoleOutput = '$ ' . $command . "\n" . implode("\n", $output) . ($exit !== 0 ? "\n[exit: {$exit}]" : '');
        $this->command = '';
    }

    public function getNodes(): array
    {
        $result = [];

        foreach (Node::all() as $node) {
            $stats = $node->statistics();
            $sys = $node->systemInformation();

            $connected = !empty($sys) && !isset($sys['exception']) && !empty($sys['os']);

            $memoryPercent = 0;
            if (($stats['memory_total'] ?? 0) > 0) {
                $memoryPercent = round((($stats['memory_used'] ?? 0) / $stats['memory_total']) * 100, 1);
            }

            $diskPercent = 0;
            if (($stats['disk_total'] ?? 0) > 0) {
                $diskPercent = round((($stats['disk_used'] ?? 0) / $stats['disk_total']) * 100, 1);
            }

            $result[] = [
                'id' => $node->id,
                'name' => $node->name,
                'fqdn' => $node->fqdn,
                'connected' => $connected,
                'os' => $connected ? ($sys['os'] . ' / ' . $sys['architecture']) : 'unknown',
                'cpu_count' => $connected ? ($sys['cpu_count'] ?? '—') : '—',
                'cpu_percent' => $connected ? ($stats['cpu_percent'] ?? 0) : 0,
                'load_average1' => $connected ? ($stats['load_average1'] ?? 0) : 0,
                'memory_used' => $stats['memory_used'] ?? 0,
                'memory_total' => $stats['memory_total'] ?? 0,
                'memory_percent' => $memoryPercent,
                'disk_used' => $stats['disk_used'] ?? 0,
                'disk_total' => $stats['disk_total'] ?? 0,
                'disk_percent' => $diskPercent,
            ];
        }

        return $result;
    }

    public function getServers(): array
    {
        $result = [];

        foreach (Server::with(['node', 'egg'])->get() as $server) {
            $status = $this->getServerStatus($server);

            $result[] = [
                'id' => $server->id,
                'uuid' => $server->uuid,
                'name' => $server->name,
                'node' => $server->node->name ?? '—',
                'egg' => $server->egg->name ?? '—',
                'image' => $server->image,
                'addr' => $server->allocation ? ($server->allocation->ip . ':' . $server->allocation->port) : '—',
                'ip' => $server->allocation->ip ?? '—',
                'port' => $server->allocation->port ?? '—',
                'memory' => $this->humanBytes($server->memory * 1000 * 1000),
                'disk' => $this->humanBytes($server->disk * 1000 * 1000),
                'status' => $status,
            ];
        }

        return $result;
    }

    protected function getServerStatus(Server $server): string
    {
        try {
            return $server->retrieveStatus()->value;
        } catch (Throwable $e) {
            return 'unknown';
        }
    }

    public function humanBytes(int $bytes): string
    {
        if ($bytes >= 1073741824) {
            return round($bytes / 1073741824, 1) . ' GB';
        }
        if ($bytes >= 1048576) {
            return round($bytes / 1048576, 1) . ' MB';
        }
        if ($bytes >= 1024) {
            return round($bytes / 1024, 1) . ' KB';
        }
        return $bytes . ' B';
    }

    public function refresh(): void
    {
        Cache::forget('nodes.*.statistics');
        foreach (Node::all() as $node) {
            Cache::forget("nodes.{$node->id}.statistics");
            Cache::forget("nodes.{$node->id}.system_information");
        }
    }

    public function power(string $uuid, string $action): void
    {
        $server = Server::where('uuid', $uuid)->with('node')->first();
        if (!$server) {
            Notification::make()->title('Server not found')->danger()->send();
            return;
        }

        try {
            $repo = new DaemonServerRepository();
            $repo->setServer($server)->setNode($server->node);
            $repo->power($action);

            Notification::make()
                ->title(ucfirst($action) . ' request sent')
                ->success()
                ->send();
        } catch (Throwable $e) {
            Notification::make()
                ->title('Power action failed')
                ->body($e->getMessage())
                ->danger()
                ->send();
        }
    }

    public function getTitle(): string
    {
        return 'Host Control';
    }

    public static function getNavigationLabel(): string
    {
        return 'Host Control';
    }

    public static function getNavigationGroup(): ?string
    {
        return trans('admin/dashboard.control');
    }

    public static function canAccess(): bool
    {
        return user()?->isRootAdmin() ?? false;
    }

    public function getHeaderActions(): array
    {
        return [
            \Filament\Actions\Action::make('refresh')
                ->label('Refresh')
                ->icon(TablerIcon::Refresh)
                ->action('refresh'),
        ];
    }
}