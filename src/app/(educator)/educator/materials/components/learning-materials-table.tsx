'use client'

import {
  IconChevronDown,
  IconChevronRight,
  IconDotsVertical,
  IconFileText,
  IconLoader2,
} from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Checkbox,
} from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  deleteLearningMaterial,
  formatLearningMaterialFileSize,
  getLearningMaterialFileUrl,
  getLearningMaterialKindLabel,
  type LearningMaterialGroupRecord,
  type LearningMaterialTargetOption,
} from '@/lib/supabase/learning-materials'

import { DeleteLearningMaterialsModal } from './delete-learning-materials-modal'
import { UploadLearningMaterialsModal } from './upload-learning-materials-modal'

interface LearningMaterialsTableProps {
  groups: LearningMaterialGroupRecord[]
  targetOptions: LearningMaterialTargetOption[]
  onGroupsChanged: (groups: LearningMaterialGroupRecord[]) => void
}

interface LearningMaterialGroupActionsProps {
  group: LearningMaterialGroupRecord
  selectedCount: number
  targetOptions: LearningMaterialTargetOption[]
  onUploaded: (groups: LearningMaterialGroupRecord[]) => void
  onDeleteGroup: (group: LearningMaterialGroupRecord) => Promise<void>
}

interface LearningMaterialFileActionsProps {
  material: LearningMaterialGroupRecord['files'][number]
  deletingMaterialId: number | null
  selectedCount: number
  onDelete: (materialId: number) => Promise<void>
}

// formatDateTime - convert timestamps into a compact label
function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

// LearningMaterialGroupActions - show compact actions for one grouped subject and section row
function LearningMaterialGroupActions({
  group,
  selectedCount,
  targetOptions,
  onUploaded,
  onDeleteGroup,
}: LearningMaterialGroupActionsProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 data-[state=open]:bg-muted"
          >
            <IconDotsVertical size={18} />
            <span className="sr-only">Open group actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => {
              setIsUploadOpen(true)
            }}
          >
            Add File
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            variant="destructive"
            onSelect={() => {
              setIsDeleteOpen(true)
            }}
          >
            {selectedCount > 0 ? `Delete All (${selectedCount})` : 'Delete All'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UploadLearningMaterialsModal
        defaultSelectionKeys={[`${group.subjectId}:${group.sectionId}`]}
        onUploaded={onUploaded}
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        targetOptions={targetOptions}
        trigger={null}
      />
      <DeleteLearningMaterialsModal
        fileCount={group.files.length}
        fileLabel={group.files[0]?.fileName || group.subjectName}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirmDelete={() => onDeleteGroup(group)}
      />
    </>
  )
}

// LearningMaterialFileActions - show compact contextual actions for one uploaded file
function LearningMaterialFileActions({
  material,
  deletingMaterialId,
  selectedCount,
  onDelete,
}: LearningMaterialFileActionsProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 data-[state=open]:bg-muted"
          >
            <IconDotsVertical size={18} />
            <span className="sr-only">Open file actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem asChild className="cursor-pointer">
            <a href={getLearningMaterialFileUrl(material.id)} rel="noreferrer" target="_blank">
              View
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <a href={getLearningMaterialFileUrl(material.id, true)} rel="noreferrer" target="_blank">
              Download
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            variant="destructive"
            disabled={deletingMaterialId === material.id}
            onSelect={() => {
              setIsDeleteOpen(true)
            }}
          >
            {deletingMaterialId === material.id
              ? 'Deleting...'
              : selectedCount > 0
                ? `Delete Selected (${selectedCount})`
                : 'Delete'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteLearningMaterialsModal
        fileCount={selectedCount > 0 ? selectedCount : 1}
        fileLabel={material.fileName}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirmDelete={() => onDelete(material.id)}
      />
    </>
  )
}

// LearningMaterialsTable - render grouped subject and section rows with nested file actions
export function LearningMaterialsTable({
  groups,
  targetOptions,
  onGroupsChanged,
}: LearningMaterialsTableProps) {
  // ==================== STATE ====================
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<number[]>([])
  const [deletingMaterialId, setDeletingMaterialId] = useState<number | null>(null)
  const defaultExpandedKey = useMemo(() => {
    const firstGroup = groups[0]
    return firstGroup ? `${firstGroup.subjectId}:${firstGroup.sectionId}` : null
  }, [groups])

  // toggleGroup - expand or collapse one grouped row
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((currentGroups) => ({
      ...currentGroups,
      [groupKey]: !(currentGroups[groupKey] ?? groupKey === defaultExpandedKey),
    }))
  }

  // toggleMaterialSelection - toggle one file checkbox
  const toggleMaterialSelection = (materialId: number, checked: boolean) => {
    setSelectedMaterialIds((currentIds) => {
      if (checked) {
        return currentIds.includes(materialId) ? currentIds : [...currentIds, materialId]
      }

      return currentIds.filter((id) => id !== materialId)
    })
  }

  // toggleGroupSelection - toggle all files inside one subject and section group
  const toggleGroupSelection = (group: LearningMaterialGroupRecord, checked: boolean) => {
    const groupMaterialIds = group.files.map((material) => material.id)

    setSelectedMaterialIds((currentIds) => {
      if (checked) {
        return Array.from(new Set([...currentIds, ...groupMaterialIds]))
      }

      return currentIds.filter((id) => !groupMaterialIds.includes(id))
    })
  }

  // handleDelete - remove one file row from the grouped table
  const handleDelete = async (materialId: number) => {
    const materialIdsToDelete =
      selectedMaterialIds.length > 0 && selectedMaterialIds.includes(materialId)
        ? [...selectedMaterialIds]
        : [materialId]

    try {
      setDeletingMaterialId(materialId)
      let nextGroups = groups

      for (const nextMaterialId of materialIdsToDelete) {
        nextGroups = await deleteLearningMaterial(nextMaterialId)
      }

      onGroupsChanged(nextGroups)
      setSelectedMaterialIds((currentIds) =>
        currentIds.filter((currentId) => !materialIdsToDelete.includes(currentId))
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete the learning material.')
    } finally {
      setDeletingMaterialId(null)
    }
  }

  // handleDeleteGroup - remove all files inside one grouped subject and section row
  const handleDeleteGroup = async (group: LearningMaterialGroupRecord) => {
    try {
      setDeletingMaterialId(group.files[0]?.id || null)
      let nextGroups = groups

      for (const material of group.files) {
        nextGroups = await deleteLearningMaterial(material.id)
      }

      onGroupsChanged(nextGroups)
      setSelectedMaterialIds((currentIds) =>
        currentIds.filter((currentId) => !group.files.some((material) => material.id === currentId))
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete the learning materials.')
    } finally {
      setDeletingMaterialId(null)
    }
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-md border p-4">
        <p className="text-sm font-medium">No learning materials found.</p>
        <p className="text-xs text-muted-foreground">
          Upload files to start sharing materials with your subject and section groups.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Subject and Section</TableHead>
          <TableHead>Files</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((group) => {
          const groupKey = `${group.subjectId}:${group.sectionId}`
          const isExpanded = expandedGroups[groupKey] ?? groupKey === defaultExpandedKey
          const selectedGroupMaterialIds = group.files
            .map((material) => material.id)
            .filter((materialId) => selectedMaterialIds.includes(materialId))
          const isGroupChecked = selectedGroupMaterialIds.length === group.files.length && group.files.length > 0
          const isGroupIndeterminate =
            selectedGroupMaterialIds.length > 0 && selectedGroupMaterialIds.length < group.files.length

          return (
            <>
              <TableRow key={groupKey}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isGroupChecked || (isGroupIndeterminate ? 'indeterminate' : false)}
                        onCheckedChange={(checked) => toggleGroupSelection(group, Boolean(checked))}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleGroup(groupKey)}
                      >
                        {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                      </Button>
                      <div>
                        <p className="text-sm font-medium">
                          {group.subjectCode} | {group.subjectName}
                        </p>
                        <p className="text-xs text-muted-foreground">{group.sectionName}</p>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{group.totalFiles}</p>
                    <span className="text-sm text-muted-foreground">|</span>
                    <span
                      className={
                        group.status === 'active'
                          ? 'rounded-md border-0 bg-green-500/10 px-2.5 py-0.5 text-green-500'
                          : 'rounded-md border-0 bg-rose-500/10 px-2.5 py-0.5 text-rose-500'
                      }
                    >
                      {group.status}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{formatDateTime(group.updatedAt)}</p>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <LearningMaterialGroupActions
                      group={group}
                      selectedCount={selectedGroupMaterialIds.length}
                      targetOptions={targetOptions}
                      onUploaded={onGroupsChanged}
                      onDeleteGroup={handleDeleteGroup}
                    />
                  </div>
                </TableCell>
              </TableRow>
              {isExpanded ? (
                <TableRow key={`${groupKey}-files`}>
                  <TableCell colSpan={4}>
                    <div className="space-y-2 rounded-md">
                      {group.files.map((material) => {
                        const materialKind = getLearningMaterialKindLabel(material.fileExtension)
                        const isSelected = selectedMaterialIds.includes(material.id)

                        return (
                          <div key={material.id} className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex min-w-0 items-center gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) =>
                                    toggleMaterialSelection(material.id, Boolean(checked))
                                  }
                                />
                              <div className="min-w-0 space-y-1">
                                <div className="flex min-w-0 items-center gap-2">
                                  <IconFileText size={16} />
                                  <p className="truncate text-sm font-medium">{material.fileName}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  <span>{formatLearningMaterialFileSize(material.fileSize)}</span>
                                  <span>{formatDateTime(material.updatedAt)}</span>
                                  <span
                                    className={
                                      materialKind === 'Presentation'
                                        ? 'rounded-md border-0 bg-blue-500/10 px-2.5 py-0.5 text-blue-500'
                                        : 'rounded-md border-0 bg-yellow-500/10 px-2.5 py-0.5 text-yellow-500'
                                    }
                                  >
                                    {materialKind}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-end md:ml-2">
                              <LearningMaterialFileActions
                                material={material}
                                deletingMaterialId={deletingMaterialId}
                                selectedCount={
                                  selectedMaterialIds.length > 0 && selectedMaterialIds.includes(material.id)
                                    ? selectedMaterialIds.length
                                    : 0
                                }
                                onDelete={handleDelete}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </>
          )
        })}
      </TableBody>
    </Table>
  )
}
