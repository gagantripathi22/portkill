package killer

import (
	"context"
	"os/exec"
	"strconv"
)

type windowsKiller struct{}

func (k *windowsKiller) Kill(ctx context.Context, pid int, force bool) error {
	var cmd *exec.Cmd
	if force {
		cmd = exec.CommandContext(ctx, "taskkill", "/F", "/PID", strconv.Itoa(pid))
	} else {
		cmd = exec.CommandContext(ctx, "taskkill", "/PID", strconv.Itoa(pid))
	}
	return cmd.Run()
}

func (k *windowsKiller) KillAll(ctx context.Context, pids []int, force bool) error {
	var lastErr error
	for _, pid := range pids {
		if err := k.Kill(ctx, pid, force); err != nil {
			lastErr = err
		}
	}
	return lastErr
}
