namespace MetaLink.Domain.Enums
{
    public enum ColorBlindTypeEnum
    {
        Normal = 0, // not color-blind
        Protanopia_Deuteranopia = 1, // protanopia/deuteranopia RedGreenDeficiency
        Tritanopia = 2, // tritanopia Blue-Yellow
        Achromatopsia = 3, // achromatopsia (“full”)
        Indeterminate = 4  // equal-highest tie
    }
}
