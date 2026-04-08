package killer

import (
	"context"
	"syscall"
)

type unixKiller struct{}

func (*unixKiller) Kill(ctx context.Context, pid int, force bool) error {
	var sig syscall.Signal
	if force {
		sig = syscall.SIGKILL
	} else {
		sig = syscall.SIGTERM
	}

	return syscall.Kill(pid, sig)
}

func (*unixKiller) KillAll(ctx context.Context, pids []int, force bool) error {
	var sig syscall.Signal
	if force {
		sig = syscall.SIGKILL
	} else {
		sig = syscall.SIGTERM
	}

	var lastErr error
	for _, pid := range pids {
		if err := syscall.Kill(pid, sig); err != nil {
			lastErr = err
		}
	}
	return lastErr
}
