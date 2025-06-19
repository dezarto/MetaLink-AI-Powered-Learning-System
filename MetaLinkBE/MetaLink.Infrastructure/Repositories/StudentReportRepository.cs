using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class StudentReportRepository : IStudentReportRepository
    {
        private readonly AppDbContext _context;

        public StudentReportRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<StudentReport?> GetByIdAsync(int id)
        {
            return await _context.StudentReports.FindAsync(id);
        }

        public async Task<List<StudentReport>> GetByStudentIdAsync(int studentId)
        {
            return await _context.StudentReports
                .Where(r => r.StudentId == studentId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<StudentReport>> GetAllAsync()
        {
            return await _context.StudentReports.ToListAsync();
        }

        public async Task AddAsync(StudentReport report)
        {
            _context.StudentReports.Add(report);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(StudentReport report)
        {
            _context.StudentReports.Update(report);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var report = await _context.StudentReports.FindAsync(id);
            if (report != null)
            {
                _context.StudentReports.Remove(report);
                await _context.SaveChangesAsync();
            }
        }
    }
}
