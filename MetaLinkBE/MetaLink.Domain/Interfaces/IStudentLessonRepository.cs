using Metalink.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Metalink.Domain.Interfaces
{
    public interface IStudentLessonRepository
    {
        Task<List<StudentLesson>> GetAllAsync();
        Task<StudentLesson?> GetByIdAsync(int id);
        Task<List<StudentLesson>> GetByLessonIdAsync(int lessonId);
        // New: list enrollments for a given student
        Task<List<StudentLesson>> GetByStudentIdAsync(int studentId);
        Task AddAsync(StudentLesson studentLesson);
        Task SaveChangesAsync();
    }
}
