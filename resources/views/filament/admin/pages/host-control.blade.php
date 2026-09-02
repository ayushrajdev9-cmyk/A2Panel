<x-filament-panels::page>
    <div class="grid grid-cols-1 gap-6">
        @forelse ($this->getNodes() as $node)
            <div class="overflow-hidden shadow-xl rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-950/5 dark:ring-white/10">
                <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-white/10">
                    <div class="flex items-center gap-3">
                        <span class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                            <span class="w-2.5 h-2.5 rounded-full {{ $node['connected'] ? 'bg-green-500' : 'bg-red-500' }}"></span>
                            {{ $node['name'] }}
                        </span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">{{ $node['fqdn'] }}</span>
                    </div>
                    <span class="text-xs px-2 py-1 rounded-lg {{ $node['connected'] ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' }}">
                        {{ $node['connected'] ? 'Connected' : 'Unreachable' }}
                    </span>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 px-5 py-5">
                    <div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">OS</div>
                        <div class="text-sm font-medium mt-1">{{ $node['os'] }}</div>
                    </div>
                    <div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">CPU Cores</div>
                        <div class="text-sm font-medium mt-1">{{ $node['cpu_count'] }}</div>
                    </div>
                    <div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">CPU Load</div>
                        <div class="text-sm font-medium mt-1">{{ $node['cpu_percent'] }}% <span class="text-xs text-gray-400">({{ $node['load_average1'] }})</span></div>
                    </div>
                    <div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">Memory</div>
                        <div class="text-sm font-medium mt-1">{{ $this->humanBytes($node['memory_used']) }} / {{ $this->humanBytes($node['memory_total']) }}</div>
                    </div>
                    <div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">Disk</div>
                        <div class="text-sm font-medium mt-1">{{ $this->humanBytes($node['disk_used']) }} / {{ $this->humanBytes($node['disk_total']) }}</div>
                    </div>
                    <div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">CPU</div>
                        <div class="text-sm font-medium mt-1">{{ $node['cpu_percent'] }}%</div>
                    </div>
                </div>

                <div class="px-5 pb-5 space-y-3">
                    @foreach ([
                        ['label' => 'CPU', 'value' => $node['cpu_percent']],
                        ['label' => 'Memory', 'value' => $node['memory_percent']],
                        ['label' => 'Disk', 'value' => $node['disk_percent']],
                    ] as $bar)
                        <div>
                            <div class="flex justify-between text-xs mb-1">
                                <span class="text-gray-500 dark:text-gray-400">{{ $bar['label'] }}</span>
                                <span class="text-gray-700 dark:text-gray-300">{{ $bar['value'] }}%</span>
                            </div>
                            <div class="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                <div class="h-full rounded-full {{ $bar['value'] > 85 ? 'bg-red-500' : ($bar['value'] > 60 ? 'bg-amber-500' : 'bg-green-500') }}" style="width: {{ min(100, max(0, $bar['value'])) }}%"></div>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        @empty
            <div class="px-6 py-10 text-center text-gray-500 shadow-lg rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-950/5">
                No nodes configured.
            </div>
        @endforelse

        <div class="overflow-hidden shadow-xl rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-950/5 dark:ring-white/10">
            <div class="px-5 py-4 border-b border-gray-200 dark:border-white/10">
                <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Servers / Containers</h2>
                <p class="text-xs text-gray-500 mt-1">Control your game server instances</p>
            </div>

            @php
                $servers = $this->getServers();
            @endphp

            @if (count($servers))
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/10">
                                <th class="px-5 py-3 font-medium">Name</th>
                                <th class="px-5 py-3 font-medium">Status</th>
                                <th class="px-5 py-3 font-medium">Image</th>
                                <th class="px-5 py-3 font-medium">Address</th>
                                <th class="px-5 py-3 font-medium">Resource</th>
                                <th class="px-5 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($servers as $server)
                                <tr class="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                                    <td class="px-5 py-3">
                                        <div class="font-medium text-gray-900 dark:text-white">{{ $server['name'] }}</div>
                                        <div class="text-xs text-gray-500">{{ $server['egg'] }}</div>
                                    </td>
                                    <td class="px-5 py-3">
                                        <span class="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg
                                            @if ($server['status'] === 'running') bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400
                                            @elseif ($server['status'] === 'starting') bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400
                                            @elseif ($server['status'] === 'installing') bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400
                                            @else bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300 @endif">
                                            {{ $server['status'] }}
                                        </span>
                                    </td>
                                    <td class="px-5 py-3 text-gray-700 dark:text-gray-300">{{ $server['image'] }}</td>
                                    <td class="px-5 py-3 text-gray-700 dark:text-gray-300">{{ $server['alloc'] }}</td>
                                    <td class="px-5 py-3 text-xs text-gray-600 dark:text-gray-300">
                                        <div>{{ $server['memory'] }}</div>
                                        <div>{{ $server['disk'] }}</div>
                                    </td>
                                    <td class="px-5 py-3">
                                        <div class="flex items-center gap-1.5">
                                            <button wire:click="power('{{ $server['uuid'] }}', 'start')" class="px-2 py-1 text-xs rounded-lg bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400" title="Start">Start</button>
                                            <button wire:click="power('{{ $server['uuid'] }}', 'restart')" class="px-2 py-1 text-xs rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400" title="Restart">Restart</button>
                                            <button wire:click="power('{{ $server['uuid'] }}', 'stop')" class="px-2 py-1 text-xs rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400" title="Stop">Stop</button>
                                        </div>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            @else
                <div class="px-6 py-10 text-center text-gray-500">No servers created yet.</div>
            @endif
        </div>
    </div>
</x-filament-panels::page>