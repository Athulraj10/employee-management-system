// REPLACE lines 612-740 in PerformanceDashboard.tsx with this:

          {!sprintFormat && (
            <div className="projects-carousel-section">
              <h1>Projects</h1>
              {loading ? (
                <div className="loading">Loading projects...</div>
              ) : projects.length === 0 ? (
                <div className="empty-state">No projects found.</div>
              ) : (
                <>
                  {/* Horizontal Carousel */}
                  <div className="carousel-wrapper">
                    <button 
                      className="carousel-nav-btn left"
                      onClick={() => scrollProjects('left')}
                      disabled={scrollPosition === 0}
                    >
                      <FaChevronLeft />
                    </button>
                    
                    <div className="projects-carousel" id="projects-carousel">
                      {projects.map((project) => {
                        const avgScore = project.avgPerformance || 0;
                        const color = getPerformanceColor(avgScore);
                        const isSelected = selectedProject === project.id;
                        
                        return (
                          <div
                            key={project.id}
                            className={`carousel-project-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleProjectClick(project.id)}
                            style={{ borderTopColor: color }}
                          >
                            <h3>{project.name}</h3>
                            <div className="carousel-card-badge" style={{ backgroundColor: color }}>
                              <span className="badge-score">{avgScore.toFixed(1)}</span>
                              <span className="badge-max">/10</span>
                            </div>
                            <div className="carousel-card-stats">
                              <span>{project.employeeCount || 0} Employees</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <button 
                      className="carousel-nav-btn right"
                      onClick={() => scrollProjects('right')}
                    >
                      <FaChevronRight />
                    </button>
                  </div>

                  {/* Selected Project Details - Slides Down */}
                  {selectedProject && (
                    <div className="project-details-panel slide-down">
                      {(() => {
                        const project = projects.find(p => p.id === selectedProject);
                        if (!project) return null;
                        const avgScore = project.avgPerformance || 0;
                        const color = getPerformanceColor(avgScore);
                        
                        return (
                          <>
                            <div className="panel-header">
                              <div className="panel-info">
                                <h2>{project.name}</h2>
                                <p className="panel-description">{project.description || 'No description'}</p>
                              </div>
                              <div className="panel-stats-row">
                                <div className="panel-stat">
                                  <span className="stat-label">Employees</span>
                                  <span className="stat-value">{project.employeeCount || 0}</span>
                                </div>
                                <div className="panel-stat">
                                  <span className="stat-label">Avg Performance</span>
                                  <span className="stat-value">{avgScore.toFixed(1)}/10</span>
                                </div>
                              </div>
                            </div>

                            <div className="panel-employees">
                              <h3>Employees</h3>
                              {loading ? (
                                <div className="loading-container">
                                  <div className="loader-compact">
                                    <div className="loader_cube loader_cube--glowing"></div>
                                    <div className="loader_cube loader_cube--color"></div>
                                  </div>
                                </div>
                              ) : employees.length === 0 ? (
                                <div className="empty-state">
                                  <p>No employees found in this project.</p>
                                </div>
                              ) : (
                                <div className={`employees-performance-grid employees-grid-expand ${expandedEmployeeId ? 'has-expanded' : ''}`}>
                                  {employees.map((employee) => {
                                    const isExpanded = expandedEmployeeId === employee.id;
                                    const detailData = employeeDetailData[employee.id];
                                    
                                    return (
                                      <div key={employee.id} className="employee-card-wrapper">
                                        <div
                                          className={`employee-performance-card ${
                                            isExpanded ? 'expanded' : expandedEmployeeId ? 'collapsed' : ''
                                          }`}
                                          onClick={() => toggleEmployeeDetail(employee)}
                                        >
                                          <div className="employee-info">
                                            <h4>{employee.name}</h4>
                                            <p className="employee-id">{employee.employeeId}</p>
                                            <p className="designation">{employee.currentDesignation}</p>
                                          </div>
                                          <div className="performance-score">
                                            <span className="score-value">{employee.performanceScore?.toFixed(1) || '0.0'}</span>
                                            <span className="score-label">/10</span>
                                          </div>
                                          <div className={`expand-indicator ${isExpanded ? 'rotated' : ''}`}>
                                            {isExpanded ? '▼' : '▶'}
                                          </div>
                                        </div>
                                        
                                        {isExpanded && (
                                          <div className="employee-detail-expanded employee-detail-slide">
                                            {loadingEmployeeDetails[employee.id] || !detailData ? (
                                              <div className="loading-container">
                                                <div className="loader-compact">
                                                  <div className="loader_cube loader_cube--glowing"></div>
                                                  <div className="loader_cube loader_cube--color"></div>
                                                </div>
                                              </div>
                                            ) : (
                                              <EmployeeDetailContent detailData={detailData} />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

