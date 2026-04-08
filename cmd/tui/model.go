package tui

import (
	"context"
	"fmt"
	"strings"

	"portkill/internal/finder"
	"portkill/internal/killer"

	"github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

var (
	selectedStyle = lipgloss.NewStyle.
			Foreground(lipgloss.Color("15")).
			Background(lipgloss.Color("75")).
			Bold(true)

	normalStyle = lipgloss.NewStyle.
			Foreground(lipgloss.Color("252"))

	headerStyle = lipgloss.NewStyle.
			Foreground(lipgloss.Color("243")).
			Bold(true)

	actionStyle = lipgloss.NewStyle.
			Foreground(lipgloss.Color("75"))

	infoStyle = lipgloss.NewStyle.
			Foreground(lipgloss.Color("245"))

	errorStyle = lipgloss.NewStyle.
			Foreground(lipgloss.Color("204"))
)

type model struct {
	processes []finder.ProcessInfo
	idx       int
	view      string
	quitting  bool
	ctx       context.Context
}

func InitialModel(processes []finder.ProcessInfo) tea.Model {
	return model{
		processes: processes,
		idx:       0,
		view:      "list",
		ctx:       context.Background(),
	}
}

func (m model) Init() tea.Cmd {
	return nil
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch m.view {
		case "list":
			m = m.updateListView(msg)
		case "actions":
			m = m.updateActionsView(msg)
		}
	}
	return m, nil
}

func (m model) updateListView(msg tea.KeyMsg) model {
	switch msg.Type {
	case tea.KeyUp, tea.KeyShiftTab:
		if m.idx > 0 {
			m.idx--
		}
	case tea.KeyDown, tea.KeyTab:
		if m.idx < len(m.processes)-1 {
			m.idx++
		}
	case tea.KeyEnter:
		m.view = "actions"
	case tea.KeyEscape, tea.KeyCtrlC:
		m.quitting = true
	}
	return m
}

func (m model) updateActionsView(msg tea.KeyMsg) model {
	switch msg.Type {
	case tea.KeyEscape, tea.KeyCtrlC:
		m.quitting = true
	case tea.KeyEnter, '1':
		m.kill(false)
	case '2':
		m.kill(true)
	case tea.KeyLeft, tea.KeyShiftTab:
		m.view = "list"
	case 'r', 'R':
		m.refresh()
	}
	return m
}

func (m *model) kill(force bool) {
	if m.idx >= len(m.processes) {
		return
	}
	p := m.processes[m.idx]
	k := killer.NewKiller()
	if err := k.Kill(m.ctx, p.PID, force); err != nil {
		m.view = "result_error"
	} else {
		m.view = "result_success"
	}
}

func (m *model) refresh() {
	processes, err := finder.ListAllPorts(m.ctx)
	if err == nil && len(processes) > 0 {
		m.processes = processes
		m.idx = 0
	}
	m.view = "list"
}

func (m model) View() string {
	if m.quitting {
		return "Goodbye!\n"
	}

	switch m.view {
	case "list":
		return m.listView()
	case "actions":
		return m.actionsView()
	case "result_success":
		return m.resultView(true)
	case "result_error":
		return m.resultView(false)
	}
	return ""
}

func (m model) listView() string {
	var s strings.Builder

	s.WriteString(headerStyle.Render("\n  portkill — Interactive Mode\n"))
	s.WriteString(headerStyle.Render("  =============================\n\n"))
	s.WriteString(infoStyle.Render("  ↑↓ Navigate  |  "))
	s.WriteString(actionStyle.Render("[Enter]"))
	s.WriteString(infoStyle.Render(" Select  |  "))
	s.WriteString(actionStyle.Render("[Esc]"))
	s.WriteString(infoStyle.Render(" Quit\n\n"))

	s.WriteString(headerStyle.Render("   #  | PID     | PORT | NAME\n"))
	s.WriteString(headerStyle.Render("  -----|---------|------|------------------\n"))

	for i, p := range m.processes {
		row := fmt.Sprintf("   %d  | %d | %d | %s", i+1, p.PID, p.Port, p.Name)
		if i == m.idx {
			s.WriteString(selectedStyle.Render(row) + "\n")
		} else {
			s.WriteString(normalStyle.Render(row) + "\n")
		}
	}

	return s.String()
}

func (m model) actionsView() string {
	p := m.processes[m.idx]

	var s strings.Builder

	s.WriteString(headerStyle.Render("\n  portkill — Actions\n"))
	s.WriteString(headerStyle.Render("  ===================\n\n"))

	s.WriteString(fmt.Sprintf("  %s (PID %d) on port %d\n\n", p.Name, p.PID, p.Port))

	s.WriteString(actionStyle.Render("  → [1] Kill (SIGTERM)      Graceful shutdown\n"))
	s.WriteString(normalStyle.Render("    [2] Force Kill (SIGKILL) Immediate termination\n\n"))
	s.WriteString(normalStyle.Render("  [R] Refresh list\n"))
	s.WriteString(normalStyle.Render("  [Esc/←] Back to list\n"))

	return s.String()
}

func (m model) resultView(success bool) string {
	var s strings.Builder
	p := m.processes[m.idx]

	if success {
		s.WriteString(headerStyle.Render("\n  ✓ Killed!\n\n"))
		s.WriteString(fmt.Sprintf("  %s (PID %d) on port %d\n", p.Name, p.PID, p.Port))
	} else {
		s.WriteString(errorStyle.Render("\n  ✗ Error\n\n"))
		s.WriteString(fmt.Sprintf("  Failed to kill %s (PID %d) on port %d\n", p.Name, p.PID, p.Port))
	}

	s.WriteString("\n  " + actionStyle.Render("[R]"))
	s.WriteString(infoStyle.Render(" Refresh  |  "))
	s.WriteString(actionStyle.Render("[Esc]"))
	s.WriteString(infoStyle.Render(" Quit\n"))

	return s.String()
}
