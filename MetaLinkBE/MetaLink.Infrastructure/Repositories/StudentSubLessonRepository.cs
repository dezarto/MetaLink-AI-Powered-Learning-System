using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Metalink.Infrastructure.Repositories
{
    public class StudentSubLessonRepository : IStudentSubLessonRepository
    {
        private readonly AppDbContext _context;
        public StudentSubLessonRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<StudentSubLesson>> GetAllAsync()
        {
            return await _context.StudentSubLessons.ToListAsync();
        }

        public async Task<StudentSubLesson?> GetByIdAsync(int id)
        {
            return await _context.StudentSubLessons.FindAsync(id);
        }

        public async Task<List<StudentSubLesson>> GetBySubLessonIdAsync(int subLessonId)
        {
            return await _context.StudentSubLessons
                .Where(ssl => ssl.SubLessonId == subLessonId)
                .ToListAsync();
        }

        public async Task<List<StudentSubLesson>> GetByStudentIdAsync(int studentId)
        {
            return await _context.StudentSubLessons
                .Where(ssl => ssl.StudentId == studentId)
                .ToListAsync();
        }

        public async Task AddAsync(StudentSubLesson studentSubLesson)
        {
            await _context.StudentSubLessons.AddAsync(studentSubLesson);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
