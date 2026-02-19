import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useNoteStore } from '../../stores/noteStore';
import { useUIStore } from '../../stores/uiStore';
import { buildGraphData, type GraphNode } from '../../utils/wikilinks';

export default function GraphView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const notes = useNoteStore(s => s.notes);
  const setActiveNote = useNoteStore(s => s.setActiveNote);
  const activeNoteId = useNoteStore(s => s.activeNoteId);
  const theme = useUIStore(s => s.theme);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = svgRef.current.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr('width', width).attr('height', height);

    const graphData = buildGraphData(notes);

    if (graphData.nodes.length === 0) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-muted)')
        .text('No notes to display');
      return;
    }

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    const g = svg.append('g');

    const simulation = d3.forceSimulation(graphData.nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(graphData.links as d3.SimulationLinkDatum<d3.SimulationNodeDatum>[])
        .id((d: any) => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(graphData.links)
      .join('line')
      .attr('stroke', 'var(--border)')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5);

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    node.append('circle')
      .attr('r', (d: GraphNode) => d.id === activeNoteId ? 10 : 7)
      .attr('fill', (d: GraphNode) => colorScale(String(d.group)))
      .attr('stroke', (d: GraphNode) => d.id === activeNoteId ? 'var(--accent)' : 'var(--bg-primary)')
      .attr('stroke-width', (d: GraphNode) => d.id === activeNoteId ? 3 : 2);

    node.append('text')
      .text((d: GraphNode) => d.title.length > 20 ? d.title.slice(0, 20) + '...' : d.title)
      .attr('x', 14)
      .attr('y', 4)
      .attr('fill', 'var(--text-primary)')
      .attr('font-size', '11px')
      .attr('font-family', 'var(--font-sans)');

    node.on('click', (_event: any, d: GraphNode) => {
      setActiveNote(d.id);
    });

    // Tooltip on hover
    node.append('title')
      .text((d: GraphNode) => d.title);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [notes, activeNoteId, theme]);

  return (
    <div className="graph-view">
      <div className="graph-header">
        <span className="graph-title">Knowledge Graph</span>
        <span className="graph-count">{notes.length} notes</span>
      </div>
      <div className="graph-container">
        <svg ref={svgRef} />
      </div>
    </div>
  );
}
