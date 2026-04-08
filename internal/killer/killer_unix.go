package killer

import (
	"context"
	"os/exec"
	"strconv"
	"syscall"
)

type unixKiller struct{}

func (k *unixKiller) Kill(ctx context.Context, pid int, force bool) error {
	var sig syscall.Signal
	if force {
		sig = syscall.SIGKILL
	} else {
		sig = syscall.SIGTERM
	}

	return syscall.Kill(pid, sig)
}

func (k *unixKiller) KillAll(ctx context.Context, pids []int, force bool) error {
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

// execKill is an alternative implementation using the kill command
func execKill(pid int, force bool) error {
	sig := "TERM"
	if force {
		sig = "KILL"
	}
	cmd := exec.Command("kill", "-"+sig, strconv.Itoa(pid))
	return cmd.Run()
}
