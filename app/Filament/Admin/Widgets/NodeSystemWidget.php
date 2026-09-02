<?php

namespace App\Filament\Admin\Widgets;

use App\Enums\TablerIcon;
use App\Models\Node;
use Exception;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class NodeSystemWidget extends FormWidget
{
    protected static ?int $sort = 1;

    public static function canView(): bool
    {
        return Node::count() > 0;
    }

    /**
     * @throws Exception
     */
    public function form(Schema $schema): Schema
    {
        if (Node::count() <= 0) {
            return $schema->components([]);
        }

        $sections = [];

        foreach (Node::all() as $node) {
            $stats = $node->statistics();
            $sys = $node->systemInformation();

            $connected = !empty($sys) && !isset($sys['exception']);

            $memoryPercent = 0;
            if (($stats['memory_total'] ?? 0) > 0) {
                $memoryPercent = round((($stats['memory_used'] ?? 0) / $stats['memory_total']) * 100, 1);
            }

            $diskPercent = 0;
            if (($stats['disk_total'] ?? 0) > 0) {
                $diskPercent = round((($stats['disk_used'] ?? 0) / $stats['disk_total']) * 100, 1);
            }

            $sections[] = Section::make($node->name)
                ->description($node->fqdn)
                ->icon(TablerIcon::Server2)
                ->iconColor($connected ? 'success' : 'danger')
                ->collapsible()
                ->persistCollapsed()
                ->columns(3)
                ->schema([
                    TextEntry::make("status_{$node->id}")
                        ->label('Status')
                        ->state($connected ? 'Connected' : 'Unreachable')
                        ->color($connected ? 'success' : 'danger'),
                    TextEntry::make("os_{$node->id}")
                        ->label('OS')
                        ->state($connected ? ($sys['os'] . ' / ' . $sys['architecture']) : 'unknown'),
                    TextEntry::make("cpu_{$node->id}")
                        ->label('CPU Load')
                        ->state($connected ? ($stats['cpu_percent'] . '% (load ' . $stats['load_average1'] . ')') : '—'),
                    TextEntry::make("cores_{$node->id}")
                        ->label('CPU Cores')
                        ->state($connected ? ($sys['cpu_count'] ?? '—') : '—'),
                    TextEntry::make("mem_{$node->id}")
                        ->label('Memory')
                        ->state($connected ? (round(($stats['memory_used'] ?? 0) / 1024 / 1024) . ' / ' . round(($stats['memory_total'] ?? 0) / 1024 / 1024) . ' MB (' . $memoryPercent . '%)') : '—'),
                    TextEntry::make("disk_{$node->id}")
                        ->label('Disk')
                        ->state($connected ? (round(($stats['disk_used'] ?? 0) / 1024 / 1024 / 1024, 1) . ' / ' . round(($stats['disk_total'] ?? 0) / 1024 / 1024 / 1024, 1) . ' GB (' . $diskPercent . '%)') : '—'),
                ]);
        }

        return $schema->components([
            Section::make('Node System Status')
                ->icon(TablerIcon::Activity)
                ->iconColor('primary')
                ->collapsible()
                ->collapsed(false)
                ->schema($sections),
        ]);
    }
}
