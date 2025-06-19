using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;

namespace Metalink.Domain.Services
{
    public class StudentService : IStudentService
    {
        private readonly IStudentRepository _studentRepository;
        public StudentService(IStudentRepository studentRepository)
        {
            _studentRepository = studentRepository;
        }

        public async Task<Student> CreateStudentAsync(Student student)
        {
            await _studentRepository.AddAsync(student);
            await _studentRepository.SaveChangesAsync();
            return student;
        }

        public async Task<Student> UpdateThemeChoiceAsync(int studentId, int? themeChoice)
        {
            var student = await _studentRepository.GetByIdAsync(studentId);
            if (student == null)
                throw new Exception("Student not found");

            // Update only ThemeChoice (defaulting to 1 if null)
            student.ThemeChoice = themeChoice ?? 1;
            student.UpdateDate = DateTime.UtcNow;

            await _studentRepository.UpdateAsync(student);
            await _studentRepository.SaveChangesAsync();

            return student;
        }

        public async Task<List<Student>> GetStudentsByUserIdAsync(int userId)
        {
            return await _studentRepository.GetStudentsByUserIdAsync(userId);
        }
        public async Task<Student> GetByIdAsync(int studentId)
        {
            return await _studentRepository.GetByIdAsync(studentId);
        }

        public async Task<Student> UpdateStudentAsync(Student student)
        {
            await _studentRepository.UpdateAsync(student);
            await _studentRepository.SaveChangesAsync();
            return student;
        }

        public async Task DeleteStudentAsync(Student student)
        {
            await _studentRepository.DeleteAsync(student);
            await _studentRepository.SaveChangesAsync();
        }
    }
}
