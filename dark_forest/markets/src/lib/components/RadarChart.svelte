<script lang="ts">
	import * as d3 from 'd3';
	import { onMount } from 'svelte';

	const PERSONALITY_VALUES: Record<string, number> = {
		// Combat Stance values
		Aggressive: 0.9,
		Defensive: 0.3,
		Balanced: 0.6,
		// Tech values
		'High Tech': 0.8,
		'Low Tech': 0.2,
		// Spending values
		Spender: 0.85,
		Hoarder: 0.15,
		// Risk Style values
		'Risk Taker': 0.9,
		'Risk Averse': 0.1,
		// Intelligence values
		Brutish: 0.3,
		Average: 0.5,
		Clever: 0.8
	} as const;

	// Define props with default values using mock data
let { 
	data = {
		combat: 'Balanced',
		tech: 'High Tech',
		spending: 'Spender',
		risk: 'Risk Taker',
		intelligence: 'Clever'
	}
} = $props<{ data?: Record<string, string> }>();

	// Convert personality traits to numerical values for the radar chart
	const traitValues = $derived(() => {
		const axes = ['Combat', 'Tech', 'Spending', 'Risk', 'Intelligence'];
		return axes.map((axis, i) => {
			// Convert to radians, starting from top and going clockwise
			const angle = (i * 2 * Math.PI) / axes.length - Math.PI / 2;
			let value = 0;
			// Get the trait value, defaulting to balanced/average if not found
			const trait = data[axis.toLowerCase()];
			value = PERSONALITY_VALUES[trait] ?? (axis === 'Intelligence' ? 0.5 : 0.6);
			return {
				axis,
				value,
				// Store both the original angle for dots/lines and the radial angle for d3.lineRadial
				angle,
				radialAngle: angle + Math.PI / 2 // Convert to radial coordinates
			};
		});
	});

	let chart: HTMLDivElement;

	onMount(() => {
		const margin = { top: 50, right: 50, bottom: 50, left: 50 };
		const width = chart.clientWidth - margin.left - margin.right;
		const height = chart.clientHeight - margin.top - margin.bottom;
		const radius = Math.min(width / 2, height / 2);

		// Clear previous SVG if it exists
		d3.select(chart).selectAll('svg').remove();

		// Create SVG
		const svg = d3
			.select(chart)
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
			.attr('transform', `translate(${width / 2 + margin.left},${height / 2 + margin.top})`);

		// Draw the circles
		const levels = 5;
		const circles = Array.from({ length: levels }, (_, i) => ((i + 1) * radius) / levels);

		svg
			.selectAll('.level')
			.data(circles)
			.join('circle')
			.attr('class', 'level')
			.attr('r', (d) => d)
			.attr('fill', 'none')
			.attr('stroke', '#00a3ff')
			.attr('stroke-width', 0.5)
			.attr('opacity', 0.2);

		// Draw the axes
		svg
			.selectAll('.axis')
			.data(traitValues())
			.join('line')
			.attr('class', 'axis')
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', (d) => radius * Math.cos(d.angle))
			.attr('y2', (d) => radius * Math.sin(d.angle))
			.attr('stroke', '#00a3ff')
			.attr('stroke-width', 1)
			.attr('opacity', 0.3);

		// Draw the area
		const points = traitValues();

		// Create the radar line generator
		const radarLine = d3
			.lineRadial<{ value: number; radialAngle: number }>()
			.angle((d) => d.radialAngle)
			.radius((d) => d.value * radius)
			.curve(d3.curveLinearClosed);

		svg
			.append('path')
			.attr('class', 'radar-path')
			.datum(points)
			.attr('d', radarLine)
			.attr('fill', 'rgba(255, 140, 0, 0.2)')
			.attr('stroke', '#ff8c00')
			.attr('stroke-width', 2);

		// Add dots at each point
		svg
			.selectAll('.dot')
			.data(points)
			.join('circle')
			.attr('class', 'dot')
			.attr('cx', (d) => radius * d.value * Math.cos(d.angle))
			.attr('cy', (d) => radius * d.value * Math.sin(d.angle))
			.attr('r', 4)
			.attr('fill', '#ff8c00')
			.attr('filter', 'url(#glow)');

		// Add labels
		svg
			.selectAll('.label')
			.data(points)
			.join('text')
			.attr('class', 'label')
			.attr('x', (d) => (radius + 20) * Math.cos(d.angle))
			.attr('y', (d) => (radius + 20) * Math.sin(d.angle))
			.attr('text-anchor', (d) => {
				if (Math.abs(Math.cos(d.angle)) < 0.1) return 'middle';
				return Math.cos(d.angle) > 0 ? 'start' : 'end';
			})
			.attr('dy', (d) => {
				if (Math.sin(d.angle) > 0.5) return '0.7em';
				if (Math.sin(d.angle) < -0.5) return '-0.3em';
				return '0.35em';
			})
			.attr('fill', '#00a3ff')
			.attr('font-size', '12px')
			.text((d) => d.axis);

		// Add glow effect
		const defs = svg.append('defs');
		const filter = defs
			.append('filter')
			.attr('id', 'glow')
			.attr('x', '-50%')
			.attr('y', '-50%')
			.attr('width', '200%')
			.attr('height', '200%');

		filter.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'coloredBlur');

		const feMerge = filter.append('feMerge');
		feMerge.append('feMergeNode').attr('in', 'coloredBlur');
		feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
	});
</script>

<div class="relative h-[200px] w-full sm:h-[400px]" bind:this={chart}></div>

<style>
	:global(.radar-path) {
		filter: drop-shadow(0 0 10px rgba(255, 140, 0, 0.3));
		transition: all 0.3s ease;
	}

	:global(.radar-path:hover) {
		filter: drop-shadow(0 0 15px rgba(255, 140, 0, 0.5));
	}

	:global(.dot) {
		transition: all 0.3s ease;
	}

	:global(.dot:hover) {
		r: 6;
	}
</style>
