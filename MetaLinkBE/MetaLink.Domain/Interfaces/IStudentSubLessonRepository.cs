using Metalink.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Metalink.Domain.Interfaces
{
    public interface IStudentSubLessonRepository
    {
        Task<List<StudentSubLesson>> GetAllAsync();
        Task<StudentSubLesson?> GetByIdAsync(int id);
        Task<List<StudentSubLesson>> GetBySubLessonIdAsync(int subLessonId);
        // New: list enrollments for a given student
        Task<List<StudentSubLesson>> GetByStudentIdAsync(int studentId);
        Task AddAsync(StudentSubLesson studentSubLesson);
        Task SaveChangesAsync();
    }
}
