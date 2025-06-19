using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface ICompanyProfileRepository
    {
        Task<CompanyProfile?> GetAsync();
        Task CreateAsync(CompanyProfile profile);
        Task UpdateAsync(CompanyProfile profile);
        Task DeleteAsync(int id);
    }
}
