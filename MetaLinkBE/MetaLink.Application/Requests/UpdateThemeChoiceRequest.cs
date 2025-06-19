namespace MetaLink.Application.Requests
{
    public class UpdateThemeChoiceRequest
    {
        public int? ThemeChoice { get; set; }  // nullable if you allow nulls, default will be 1 if not provided
    }
}
