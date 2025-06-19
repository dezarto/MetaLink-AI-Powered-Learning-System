using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Metalink.Infrastructure.Repositories
{
    public class StudentCourseRepository : IStudentCourseRepository
    {
        private readonly AppDbContext _context;
        public StudentCourseRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<StudentCourse>> GetAllAsync()
        {
            return await _context.StudentCourses.ToListAsync();
        }

        public async Task<StudentCourse?> GetByIdAsync(int id)
        {
            return await _context.StudentCourses.FindAsync(id);
        }

        public async Task<List<StudentCourse>> GetByCourseIdAsync(int courseId)
        {
            return await _context.StudentCourses
                .Where(sc => sc.CourseId == courseId)
                .ToListAsync();
        }

        public async Task<List<StudentCourse>> GetByStudentIdAsync(int studentId)
        {
            return await _context.StudentCourses
                .Where(sc => sc.StudentId == studentId)
                .ToListAsync();
        }

        public async Task AddAsync(StudentCourse studentCourse)
        {
            await _context.StudentCourses.AddAsync(studentCourse);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
