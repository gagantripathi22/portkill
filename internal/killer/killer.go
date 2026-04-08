package killer

import (
	"context"
	"fmt"
	"runtime"
)

// Killer kills processes
type Killer interface {
	Kill(ctx context.Context, pid int, force bool) error
	KillAll(ctx context.Context, pids []int, force bool) error
}

// NewKiller returns the appropriate killer for the current OS
func NewKiller() Killer {
	switch runtime.GOOS {
	case "windows":
		return &windowsKiller{}
	default:
		return &unixKiller{}
	}
}

// Kill is a convenience function
func Kill(ctx context.Context, pid int, force bool) error {
	k := NewKiller()
	return k.Kill(ctx, pid, force)
}

// ErrProcessNotFound is returned when the process doesn't exist
var ErrProcessNotFound = fmt.Errorf("process not found or already terminated")

// ErrPermissionDenied is returned when lacking permissions
var ErrPermissionDenied = fmt.Errorf("permission denied; try running with elevated privileges")
