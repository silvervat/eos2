'use client'

import { useState, useCallback, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Plus, Save, Trash2, Edit, Play } from 'lucide-react'
import type { Workflow, WorkflowState, WorkflowTransition } from '@rivest/types'

// Default workflow for projects
const defaultProjectWorkflow: Workflow = {
  id: 'default-project',
  tenantId: 'demo',
  entityType: 'projects',
  name: 'Projekti töövoog',
  description: 'Projekti elutsükli haldamine',
  states: [
    { id: 'draft', name: 'draft', label: 'Mustand', color: '#94a3b8', canEdit: ['admin', 'manager', 'user'], canTransition: ['admin', 'manager'] },
    { id: 'active', name: 'active', label: 'Aktiivne', color: '#279989', canEdit: ['admin', 'manager'], canTransition: ['admin', 'manager'] },
    { id: 'review', name: 'review', label: 'Ülevaatusel', color: '#eab308', canEdit: ['admin'], canTransition: ['admin'] },
    { id: 'completed', name: 'completed', label: 'Lõpetatud', color: '#22c55e', canEdit: ['admin'], canTransition: ['admin'] },
    { id: 'archived', name: 'archived', label: 'Arhiveeritud', color: '#6b7280', canEdit: [], canTransition: [] },
  ],
  transitions: [
    { id: 't1', name: 'activate', label: 'Aktiveeri', from: 'draft', to: 'active', allowedRoles: ['admin', 'manager'], requireComment: false },
    { id: 't2', name: 'submit_review', label: 'Saada ülevaatusele', from: 'active', to: 'review', allowedRoles: ['admin', 'manager'], requireComment: true },
    { id: 't3', name: 'approve', label: 'Kinnita', from: 'review', to: 'completed', allowedRoles: ['admin'], requireComment: false },
    { id: 't4', name: 'reject', label: 'Tagasi töösse', from: 'review', to: 'active', allowedRoles: ['admin'], requireComment: true, buttonVariant: 'destructive' },
    { id: 't5', name: 'archive', label: 'Arhiveeri', from: 'completed', to: 'archived', allowedRoles: ['admin'], requireComment: false },
  ],
  initialState: 'draft',
  allowManualTransitions: true,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// Mock workflows by entity type
const mockWorkflows: Record<string, Workflow> = {
  projects: defaultProjectWorkflow,
  invoices: {
    ...defaultProjectWorkflow,
    id: 'default-invoice',
    entityType: 'invoices',
    name: 'Arve töövoog',
    description: 'Arvete elutsükli haldamine',
    states: [
      { id: 'draft', name: 'draft', label: 'Mustand', color: '#94a3b8', canEdit: ['admin', 'manager', 'user'], canTransition: ['admin', 'manager'] },
      { id: 'sent', name: 'sent', label: 'Saadetud', color: '#3b82f6', canEdit: ['admin'], canTransition: ['admin'] },
      { id: 'paid', name: 'paid', label: 'Makstud', color: '#22c55e', canEdit: [], canTransition: ['admin'] },
      { id: 'overdue', name: 'overdue', label: 'Tähtaja ületanud', color: '#ef4444', canEdit: ['admin'], canTransition: ['admin'] },
      { id: 'cancelled', name: 'cancelled', label: 'Tühistatud', color: '#6b7280', canEdit: [], canTransition: [] },
    ],
    transitions: [
      { id: 't1', name: 'send', label: 'Saada', from: 'draft', to: 'sent', allowedRoles: ['admin', 'manager'], requireComment: false },
      { id: 't2', name: 'mark_paid', label: 'Märgi makstuks', from: 'sent', to: 'paid', allowedRoles: ['admin'], requireComment: false },
      { id: 't3', name: 'mark_overdue', label: 'Märgi hilinenud', from: 'sent', to: 'overdue', allowedRoles: ['admin'], requireComment: false },
      { id: 't4', name: 'pay_overdue', label: 'Märgi makstuks', from: 'overdue', to: 'paid', allowedRoles: ['admin'], requireComment: false },
      { id: 't5', name: 'cancel', label: 'Tühista', from: 'draft', to: 'cancelled', allowedRoles: ['admin'], requireComment: true, buttonVariant: 'destructive' },
    ],
    initialState: 'draft',
  },
}

// Convert workflow states to ReactFlow nodes
function convertStatesToNodes(states: WorkflowState[]): Node[] {
  const positions: Record<string, { x: number; y: number }> = {
    draft: { x: 100, y: 200 },
    active: { x: 350, y: 200 },
    review: { x: 600, y: 200 },
    completed: { x: 850, y: 200 },
    archived: { x: 1100, y: 200 },
    sent: { x: 350, y: 200 },
    paid: { x: 600, y: 100 },
    overdue: { x: 600, y: 300 },
    cancelled: { x: 350, y: 400 },
  }

  return states.map((state) => ({
    id: state.id,
    type: 'stateNode',
    data: { state },
    position: positions[state.id] || { x: 250, y: 200 },
  }))
}

// Convert workflow transitions to ReactFlow edges
function convertTransitionsToEdges(transitions: WorkflowTransition[]): Edge[] {
  return transitions.map((transition) => ({
    id: transition.id,
    source: transition.from,
    target: transition.to,
    label: transition.label,
    type: 'smoothstep',
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: {
      stroke: transition.buttonVariant === 'destructive' ? '#ef4444' : '#279989',
      strokeWidth: 2,
    },
    labelStyle: {
      fill: '#334155',
      fontWeight: 500,
      fontSize: 12,
    },
    labelBgStyle: {
      fill: '#ffffff',
      fillOpacity: 0.9,
    },
    data: { transition },
  }))
}

// Custom State Node Component
function StateNode({ data, selected }: { data: { state: WorkflowState }; selected: boolean }) {
  const state = data.state

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 shadow-lg min-w-[140px] transition-all ${
        selected ? 'ring-2 ring-offset-2 ring-primary' : ''
      }`}
      style={{
        backgroundColor: state.color + '20',
        borderColor: state.color,
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-400" />
      <div className="font-semibold text-slate-900">{state.label}</div>
      <div className="text-xs text-slate-500 font-mono">{state.name}</div>
      <div className="mt-2 flex gap-1 flex-wrap">
        {state.canEdit.slice(0, 2).map((role) => (
          <span
            key={role}
            className="text-[10px] px-1.5 py-0.5 rounded bg-white/50 text-slate-600"
          >
            {role}
          </span>
        ))}
        {state.canEdit.length > 2 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/50 text-slate-600">
            +{state.canEdit.length - 2}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-slate-400" />
    </div>
  )
}

const nodeTypes = {
  stateNode: StateNode,
}

interface WorkflowBuilderProps {
  entityType: string
}

export function WorkflowBuilder({ entityType }: WorkflowBuilderProps) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null)
  const [isEditingState, setIsEditingState] = useState(false)
  const [isEditingTransition, setIsEditingTransition] = useState(false)

  // Load workflow for entity type
  useEffect(() => {
    const wf = mockWorkflows[entityType] || mockWorkflows.projects
    setWorkflow(wf)
    setNodes(convertStatesToNodes(wf.states))
    setEdges(convertTransitionsToEdges(wf.transitions))
  }, [entityType, setNodes, setEdges])

  // Handle new connection (transition)
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!workflow || !connection.source || !connection.target) return

      const newTransition: WorkflowTransition = {
        id: `t_${Date.now()}`,
        name: `${connection.source}_to_${connection.target}`,
        label: 'Uus üleminek',
        from: connection.source,
        to: connection.target,
        allowedRoles: ['admin'],
        requireComment: false,
      }

      setWorkflow({
        ...workflow,
        transitions: [...workflow.transitions, newTransition],
      })

      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: newTransition.id,
            type: 'smoothstep',
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
            label: newTransition.label,
            style: { stroke: '#279989', strokeWidth: 2 },
            data: { transition: newTransition },
          },
          eds
        )
      )
    },
    [workflow, setEdges]
  )

  // Add new state
  const addState = () => {
    if (!workflow) return

    const newState: WorkflowState = {
      id: `state_${Date.now()}`,
      name: 'new_state',
      label: 'Uus olek',
      color: '#279989',
      canEdit: ['admin', 'manager'],
      canTransition: ['admin', 'manager'],
    }

    setWorkflow({
      ...workflow,
      states: [...workflow.states, newState],
    })

    const newNode: Node = {
      id: newState.id,
      type: 'stateNode',
      data: { state: newState },
      position: { x: 400, y: 100 + Math.random() * 200 },
    }

    setNodes((nds) => [...nds, newNode])
  }

  // Delete selected node
  const deleteSelectedNode = () => {
    if (!workflow || !selectedNode) return

    // Remove state and its transitions
    setWorkflow({
      ...workflow,
      states: workflow.states.filter((s) => s.id !== selectedNode.id),
      transitions: workflow.transitions.filter(
        (t) => t.from !== selectedNode.id && t.to !== selectedNode.id
      ),
    })

    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
    )
    setSelectedNode(null)
  }

  // Delete selected edge
  const deleteSelectedEdge = () => {
    if (!workflow || !selectedEdge) return

    setWorkflow({
      ...workflow,
      transitions: workflow.transitions.filter((t) => t.id !== selectedEdge.id),
    })

    setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id))
    setSelectedEdge(null)
  }

  // Save workflow
  const handleSave = () => {
    if (!workflow) return
    console.log('Saving workflow:', workflow)
    alert('Töövoog salvestatud! (demo)')
  }

  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setSelectedEdge(null)
  }, [])

  // Handle edge selection
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge)
    setSelectedNode(null)
  }, [])

  // Handle background click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setSelectedEdge(null)
  }, [])

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Laadin töövoogu...</div>
      </div>
    )
  }

  return (
    <div className="h-[600px] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 p-4 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{workflow.name}</h2>
          <p className="text-sm text-slate-500">{workflow.description}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={addState}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Lisa olek
          </button>

          {selectedNode && (
            <>
              <button
                onClick={() => setIsEditingState(true)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Muuda
              </button>
              <button
                onClick={deleteSelectedNode}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-red-300 bg-white text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Kustuta
              </button>
            </>
          )}

          {selectedEdge && (
            <>
              <button
                onClick={() => setIsEditingTransition(true)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Muuda üleminekut
              </button>
              <button
                onClick={deleteSelectedEdge}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-red-300 bg-white text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Kustuta
              </button>
            </>
          )}

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
            style={{ backgroundColor: '#279989' }}
          >
            <Save className="h-4 w-4" />
            Salvesta
          </button>
        </div>
      </div>

      {/* Flow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
          }}
        >
          <Controls />
          <Background gap={16} size={1} />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="border-t border-slate-200 p-3 bg-slate-50 flex items-center gap-6 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-2 border-slate-400 bg-slate-100" />
          <span>Olek (State)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-[#279989]" />
          <span>Üleminek (Transition)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-red-500" />
          <span>Tagasilükkamine</span>
        </div>
        <div className="ml-auto text-slate-400">
          <Play className="h-4 w-4 inline mr-1" />
          Algne olek: <strong>{workflow.initialState}</strong>
        </div>
      </div>
    </div>
  )
}
