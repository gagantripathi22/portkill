package finder

import (
	"bufio"
	"context"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
)

type linuxFinder struct{}

func (f *linuxFinder) FindByPort(ctx context.Context, port int) ([]ProcessInfo, error) {
	// Try ss first (modern), fall back to netstat
	processes, err := f.findByPortSS(ctx, port)
	if err != nil {
		return f.findByPortNetstat(ctx, port)
	}
	return processes, nil
}

func (f *linuxFinder) findByPortSS(ctx context.Context, port int) ([]ProcessInfo, error) {
	cmd := exec.CommandContext(ctx, "ss", "-tlnp")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var processes []ProcessInfo
	portStr := strconv.Itoa(port)

	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		line := scanner.Text()
		if strings.Contains(line, ":"+portStr) {
			// Parse ss output: State Recv-Q Send-Q Local Address:Port Peer Address:Port Process
			parts := strings.Fields(line)
			if len(parts) >= 6 {
				localAddr := parts[3]
				processInfo := parts[len(parts)-1]

				// Extract PID and name from process info like "pid=1234(process_name)"
				pid := 0
				name := "unknown"
				if re := regexp.MustCompile(`pid=(\d+).*?\((\w+)\)`); re.MatchString(processInfo) {
					matches := re.FindStringSubmatch(processInfo)
					pid, _ = strconv.Atoi(matches[1])
					name = matches[2]
				}

				if pid > 0 {
					user := ""
					if len(parts) >= 5 {
						user = parts[5]
					}

					cmdLine := f.getCmdLine(ctx, pid)

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
	}

	return processes, nil
}

func (f *linuxFinder) findByPortNetstat(ctx context.Context, port int) ([]ProcessInfo, error) {
	cmd := exec.CommandContext(ctx, "netstat", "-tlnp")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var processes []ProcessInfo
	portStr := ":" + strconv.Itoa(port)

	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		line := scanner.Text()
		if strings.Contains(line, portStr) && strings.Contains(line, "LISTEN") {
			parts := strings.Fields(line)
			if len(parts) >= 7 {
				processInfo := parts[6]

				pid := 0
				name := "unknown"
				if idx := strings.Index(processInfo, "/"); idx >= 0 {
					pidStr := processInfo[:idx]
					name = processInfo[idx+1:]
					pid, _ = strconv.Atoi(pidStr)
				}

				if pid > 0 {
					user := parts[2]
					cmdLine := f.getCmdLine(ctx, pid)

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
	}

	return processes, nil
}

func (f *linuxFinder) FindByPattern(ctx context.Context, pattern string) ([]ProcessInfo, error) {
	cmd := exec.CommandContext(ctx, "ps", "aux")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var processes []ProcessInfo
	re := regexp.MustCompile(`(?i)` + pattern)

	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		line := scanner.Text()
		// Skip header
		if strings.HasPrefix(line, "USER") {
			continue
		}
		parts := strings.Fields(line)
		if len(parts) >= 11 {
			name := parts[10]
			if re.MatchString(name) || re.MatchString(parts[10]) {
				pid, _ := strconv.Atoi(parts[1])
				user := parts[0]
				cmdLine := strings.Join(parts[10:], " ")

				processes = append(processes, ProcessInfo{
					PID:   pid,
					Name:  name,
					User:  user,
					CMD:   cmdLine,
				})
			}
		}
	}

	return processes, nil
}

func (f *linuxFinder) ListAll(ctx context.Context) ([]ProcessInfo, error) {
	// Try ss first
	processes, err := f.listAllSS(ctx)
	if err != nil {
		return f.listAllNetstat(ctx)
	}
	return processes, nil
}

func (f *linuxFinder) listAllSS(ctx context.Context) ([]ProcessInfo, error) {
	cmd := exec.CommandContext(ctx, "ss", "-tlnp")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var processes []ProcessInfo
	seen := make(map[int]bool)

	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "State") || line == "" {
			continue
		}
		parts := strings.Fields(line)
		if len(parts) >= 6 {
			localAddr := parts[3]
			processInfo := parts[len(parts)-1]

			// Extract port
			port := 0
			if idx := strings.LastIndex(localAddr, ":"); idx >= 0 {
				port, _ = strconv.Atoi(localAddr[idx+1:])
			}

			// Extract PID and name
			pid := 0
			name := "unknown"
			if re := regexp.MustCompile(`pid=(\d+).*?\((\w+)\)`); re.MatchString(processInfo) {
				matches := re.FindStringSubmatch(processInfo)
				pid, _ = strconv.Atoi(matches[1])
				name = matches[2]
			}

			if pid > 0 && !seen[pid] {
				seen[pid] = true
				user := ""
				if len(parts) >= 5 {
					user = parts[5]
				}
				cmdLine := f.getCmdLine(ctx, pid)

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

func (f *linuxFinder) listAllNetstat(ctx context.Context) ([]ProcessInfo, error) {
	cmd := exec.CommandContext(ctx, "netstat", "-tlnp")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	var processes []ProcessInfo
	seen := make(map[int]bool)

	scanner := bufio.NewScanner(strings.NewReader(string(output)))
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "Proto") || line == "" {
			continue
		}
		parts := strings.Fields(line)
		if len(parts) >= 7 && strings.Contains(line, "LISTEN") {
			processInfo := parts[6]
			localAddr := parts[3]

			// Extract port
			port := 0
			if idx := strings.LastIndex(localAddr, ":"); idx >= 0 {
				port, _ = strconv.Atoi(localAddr[idx+1:])
			}

			pid := 0
			name := "unknown"
			if idx := strings.Index(processInfo, "/"); idx >= 0 {
				pidStr := processInfo[:idx]
				name = processInfo[idx+1:]
				pid, _ = strconv.Atoi(pidStr)
			}

			if pid > 0 && !seen[pid] {
				seen[pid] = true
				user := parts[2]
				cmdLine := f.getCmdLine(ctx, pid)

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

func (f *linuxFinder) getCmdLine(ctx context.Context, pid int) string {
	cmd := exec.CommandContext(ctx, "cat", "/proc/"+strconv.Itoa(pid)+"/cmdline")
	output, err := cmd.Output()
	if err != nil {
		return ""
	}
	return strings.ReplaceAll(string(output), "\x00", " ")
}
