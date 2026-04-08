package finder

import (
	"bufio"
	"context"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
)

type darwinFinder struct{}

func (f *darwinFinder) FindByPort(ctx context.Context, port int) ([]ProcessInfo, error) {
	cmd := exec.CommandContext(ctx, "lsof", "-i", "-P", "-n", "-sTCP:LISTEN")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var processes []ProcessInfo
	portStr := strconv.Itoa(port)
	seen := make(map[int]bool)

	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		line := scanner.Text()
		// Skip header
		if strings.HasPrefix(line, "COMMAND") {
			continue
		}
		if strings.Contains(line, ":"+portStr) && strings.Contains(line, "(LISTEN)") {
			parts := strings.Fields(line)
			if len(parts) >= 9 {
				pid, err := strconv.Atoi(parts[1])
				if err != nil {
					continue
				}
				if seen[pid] {
					continue
				}
				seen[pid] = true

				name := parts[0]
				user := parts[2]
				cmdLine := strings.Join(parts[8:], " ")

				processes = append(processes, ProcessInfo{
					PID:   pid,
					Name:  name,
					Port:  port,
					User:  user,
					CMD:   cmdLine,
				})
			}
		}
	}

	return processes, nil
}

func (f *darwinFinder) FindByPattern(ctx context.Context, pattern string) ([]ProcessInfo, error) {
	cmd := exec.CommandContext(ctx, "lsof", "-i", "-P", "-n")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var processes []ProcessInfo
	re := regexp.MustCompile(`(?i)` + pattern)
	seen := make(map[int]bool)

	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "COMMAND") {
			continue
		}
		parts := strings.Fields(line)
		if len(parts) >= 3 {
			name := parts[0]
			if re.MatchString(name) {
				pid, _ := strconv.Atoi(parts[1])
				if seen[pid] {
					continue
				}
				seen[pid] = true

				user := parts[2]
				processes = append(processes, ProcessInfo{
					PID:  pid,
					Name: name,
					User: user,
				})
			}
		}
	}

	return processes, nil
}

func (f *darwinFinder) ListAll(ctx context.Context) ([]ProcessInfo, error) {
	cmd := exec.CommandContext(ctx, "lsof", "-i", "-P", "-n", "-sTCP:LISTEN")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var processes []ProcessInfo
	seen := make(map[int]bool)

	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "COMMAND") {
			continue
		}
		parts := strings.Fields(line)
		if len(parts) >= 9 {
			pid, _ := strconv.Atoi(parts[1])
			if seen[pid] {
				continue
			}
			seen[pid] = true

			name := parts[0]
			user := parts[2]
			cmdLine := strings.Join(parts[8:], " ")

			// Extract port from the address
			port := 0
			if idx := strings.LastIndex(parts[8], ":"); idx >= 0 {
				port, _ = strconv.Atoi(parts[8][idx+1:])
			}

			processes = append(processes, ProcessInfo{
				PID:   pid,
				Name:  name,
				Port:  port,
				User:  user,
				CMD:   cmdLine,
			})
		}
	}

	return processes, nil
}
