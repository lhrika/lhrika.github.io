export type RoutineStatus = 'done' | 'todo' | 'disabled'

export interface RoutineData {
	status: RoutineStatus[]
	// last reset timestamp
	resetAt: number
}
