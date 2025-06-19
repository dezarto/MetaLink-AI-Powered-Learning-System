using Metalink.Domain.Entities;

namespace Metalink.Domain.Interfaces
{
    public interface IStudentRepository
    {
        Task<Student> GetByIdAsync(int id);
        Task<List<Student>> GetAllAsync();
        Task<List<Student>> GetByParentIdAsync(int parentId);
        Task AddAsync(Student student);
        Task UpdateAsync(Student student);
        Task DeleteAsync(Student student);
        Task<List<Student>> GetStudentsByUserIdAsync(int userId);
        Task SaveChangesAsync();
    }
}
