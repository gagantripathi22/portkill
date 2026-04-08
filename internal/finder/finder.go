package finder

import (
	"context"
	"fmt"
	"runtime"
)

// ProcessInfo holds information about a process using a port
type ProcessInfo struct {
	PID   int
	Name  string
	Port  int
	User  string
	CMD   string
}

// Finder discovers processes using ports
type Finder interface {
	FindByPort(ctx context.Context, port int) ([]ProcessInfo, error)
	FindByPattern(ctx context.Context, pattern string) ([]ProcessInfo, error)
	ListAll(ctx context.Context) ([]ProcessInfo, error)
}

// NewFinder returns the appropriate finder for the current OS
func NewFinder() Finder {
	switch runtime.GOOS {
	case "windows":
		return &windowsFinder{}
	case "darwin":
		return &darwinFinder{}
	default:
		return &linuxFinder{}
	}
}

// FindPort is a convenience function that creates a finder and finds by port
func FindPort(ctx context.Context, port int) ([]ProcessInfo, error) {
	f := NewFinder()
	return f.FindByPort(ctx, port)
}

// FindPattern is a convenience function that creates a finder and finds by pattern
func FindPattern(ctx context.Context, pattern string) ([]ProcessInfo, error) {
	f := NewFinder()
	return f.FindByPattern(ctx, pattern)
}

// ListAllPorts is a convenience function that creates a finder and lists all
func ListAllPorts(ctx context.Context) ([]ProcessInfo, error) {
	f := NewFinder()
	return f.ListAll(ctx)
}

// ErrProcessNotFound is returned when no process is found on a port
var ErrProcessNotFound = fmt.Errorf("no process found")
