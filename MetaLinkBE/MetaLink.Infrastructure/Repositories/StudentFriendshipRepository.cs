using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Metalink.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class StudentFriendshipRepository : IStudentFriendshipRepository
    {
        private readonly AppDbContext _context;

        public StudentFriendshipRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<StudentFriendship> GetByIdAsync(int id)
        {
            return await _context.StudentFriendships
                .FirstOrDefaultAsync(f => f.Id == id);
        }

        public async Task<IEnumerable<StudentFriendship>> GetPendingRequestsAsync(int studentId)
        {
            return await _context.StudentFriendships
                .Where(f => f.TargetStudentId == studentId && f.Status == "Pending")
                .ToListAsync();
        }

        public async Task<IEnumerable<StudentFriendship>> GetSentRequestsAsync(int studentId)
        {
            return await _context.StudentFriendships
                .Where(f => f.RequesterStudentId == studentId && f.Status == "Pending")
                .ToListAsync();
        }

        public async Task<IEnumerable<StudentFriendship>> GetFriendsAsync(int studentId)
        {
            return await _context.StudentFriendships
                .Where(f => (f.RequesterStudentId == studentId || f.TargetStudentId == studentId) && f.Status == "Accepted")
                .ToListAsync();
        }

        public async Task<IEnumerable<StudentFriendship>> GetBlockedUsersAsync(int studentId)
        {
            return await _context.StudentFriendships
                .Where(f => f.BlockerId == studentId && f.Status == "Blocked")
                .ToListAsync();
        }

        public async Task<StudentFriendship> AddAsync(StudentFriendship friendship)
        {
            _context.StudentFriendships.Add(friendship);
            await _context.SaveChangesAsync();
            return friendship;
        }

        public async Task<StudentFriendship> UpdateAsync(StudentFriendship friendship)
        {
            _context.StudentFriendships.Update(friendship);
            await _context.SaveChangesAsync();
            return friendship;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var friendship = await _context.StudentFriendships.FindAsync(id);
            if (friendship == null)
                return false;

            _context.StudentFriendships.Remove(friendship);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
