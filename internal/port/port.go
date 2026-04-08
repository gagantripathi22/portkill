package port

import (
	"fmt"
	"strconv"
	"strings"
)

// Validate checks if a port number is valid (1-65535)
func Validate(port int) error {
	if port < 1 || port > 65535 {
		return fmt.Errorf("port must be between 1 and 65535, got %d", port)
	}
	return nil
}

// ParsePort converts a string to a port number.
// Handles formats like "3000", ":3000"
func ParsePort(s string) (int, error) {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, ":")

	port, err := strconv.Atoi(s)
	if err != nil {
		return 0, fmt.Errorf("invalid port: %s", s)
	}

	if err := Validate(port); err != nil {
		return 0, err
	}

	return port, nil
}

// ParsePorts converts a comma-separated string of ports to a slice of ints
func ParsePorts(s string) ([]int, error) {
	parts := strings.Split(s, ",")
	ports := make([]int, 0, len(parts))

	for _, p := range parts {
		port, err := ParsePort(strings.TrimSpace(p))
		if err != nil {
			return nil, err
		}
		ports = append(ports, port)
	}

	return ports, nil
}
