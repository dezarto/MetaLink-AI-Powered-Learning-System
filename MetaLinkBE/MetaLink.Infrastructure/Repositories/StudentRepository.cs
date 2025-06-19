using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Metalink.Infrastructure.Repositories
{
    public class StudentRepository : IStudentRepository
    {
        private readonly AppDbContext _context;
        public StudentRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Student student)
        {
            await _context.Students.AddAsync(student);
        }

        public async Task DeleteAsync(Student student)
        {
            _context.Students.Remove(student);
        }

        public async Task<List<Student>> GetAllAsync()
        {
            return await _context.Students.ToListAsync();
        }

        public async Task<Student> GetByIdAsync(int id)
        {
            return await _context.Students.FindAsync(id);
        }

        public async Task<List<Student>> GetByParentIdAsync(int parentId)
        {
            return await _context.Students
                .Where(s => s.UserID == parentId)
                .ToListAsync();
        }

        // Ek metod: Kullanıcıya (parent) ait öğrencileri döndürür.
        public async Task<List<Student>> GetStudentsByUserIdAsync(int userId)
        {
            return await _context.Students
                .Where(s => s.UserID == userId)
                .ToListAsync();
        }

        public async Task UpdateAsync(Student student)
        {
            _context.Students.Update(student);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
