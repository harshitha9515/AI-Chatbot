import { useState, useRef } from "react";
import { Upload, Pencil, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ImageStyle = {
  name: string;
  prompt: string;
  emoji: string;
  gradient: string;
};

const IMAGE_STYLES: ImageStyle[] = [
  { name: "Caricature", prompt: "caricature cartoon style, fun exaggerated features, colorful anime-inspired illustration, detailed character art", emoji: "🎨", gradient: "from-pink-500 to-purple-500" },
  { name: "Lunar New Year", prompt: "Lunar New Year celebration style, red lanterns, cherry blossoms, festive Chinese cultural elements, warm golden lighting", emoji: "🏮", gradient: "from-red-500 to-amber-500" },
  { name: "Flower Petals", prompt: "made entirely of delicate flower petals, botanical art, soft pink and white floral composition, ethereal beauty", emoji: "🌸", gradient: "from-pink-300 to-rose-400" },
  { name: "Gold", prompt: "golden metallic sculpture, luxurious gold material, dramatic lighting, premium 3D render, ornate golden details", emoji: "✨", gradient: "from-yellow-500 to-amber-600" },
  { name: "Crayon", prompt: "cute crayon drawing style, kawaii illustration, colorful childlike art, playful doodle style", emoji: "🖍️", gradient: "from-orange-400 to-yellow-400" },
  { name: "Paparazzi", prompt: "paparazzi photo style, celebrity red carpet, flash photography, dramatic news photography, professional press photo", emoji: "📸", gradient: "from-gray-700 to-gray-900" },
  { name: "Clouds", prompt: "ethereal cloud formation, dreamy sky art, fluffy white clouds shaped into form, heavenly atmosphere, magical sky", emoji: "☁️", gradient: "from-sky-300 to-blue-400" },
  { name: "Dept. Photoshoot", prompt: "professional department store photoshoot, studio lighting, elegant pose, high-fashion photography, warm tones", emoji: "📷", gradient: "from-amber-300 to-amber-600" },
  { name: "Minimalist", prompt: "clean minimalist portrait, white background, elegant and simple, studio photography, modern aesthetic", emoji: "🤍", gradient: "from-gray-200 to-gray-400" },
  { name: "Kalighat", prompt: "Kalighat painting style, traditional Indian folk art, bold outlines, warm earth tones, Bengali art tradition", emoji: "🎭", gradient: "from-orange-500 to-yellow-600" },
  { name: "Chikankari", prompt: "Chikankari embroidery style portrait, delicate white threadwork on pastel fabric, Lucknowi craft aesthetic, elegant Indian textile art", emoji: "🧵", gradient: "from-rose-200 to-pink-400" },
  { name: "Rajasthani Textile", prompt: "Rajasthani textile pattern style, vibrant block print, traditional Indian fabric art, rich orange and red patterns", emoji: "🪭", gradient: "from-orange-600 to-red-600" },
  { name: "Neon Fantasy", prompt: "neon rainbow fantasy art, cute kawaii style, vibrant colors, sparkles and stars, magical glow", emoji: "🌈", gradient: "from-violet-500 to-fuchsia-500" },
  { name: "Bollywood", prompt: "Bollywood movie poster style, dramatic lighting, vibrant colors, cinematic composition, filmy aesthetic", emoji: "🎬", gradient: "from-red-500 to-orange-500" },
  { name: "Sketch", prompt: "detailed pencil sketch, hand-drawn illustration on paper, realistic graphite drawing, artistic shading", emoji: "✏️", gradient: "from-gray-400 to-gray-600" },
  { name: "Iconic", prompt: "iconic black and white photography, dramatic contrast, artistic portrait, cinematic masterpiece", emoji: "🖤", gradient: "from-gray-700 to-gray-900" },
  { name: "Festival", prompt: "colorful Indian festival celebration, Holi colors, vibrant joyful atmosphere, powder colors explosion", emoji: "🎉", gradient: "from-blue-500 to-green-500" },
  { name: "Watercolor", prompt: "beautiful watercolor painting, soft flowing colors, artistic brush strokes, dreamy wet paint effect", emoji: "🎨", gradient: "from-cyan-400 to-teal-500" },
  { name: "Pop Art", prompt: "Andy Warhol pop art style, bold colors, halftone dots, comic style, retro pop culture", emoji: "🔴", gradient: "from-red-500 to-blue-500" },
  { name: "Cyberpunk", prompt: "cyberpunk neon city style, futuristic, glowing neon lights, sci-fi aesthetic, blade runner vibes", emoji: "🤖", gradient: "from-cyan-500 to-purple-600" },
  { name: "Pixel Art", prompt: "retro pixel art style, 8-bit game graphics, nostalgic pixelated illustration, classic gaming art", emoji: "👾", gradient: "from-green-500 to-emerald-600" },
  { name: "Oil Painting", prompt: "classical oil painting style, rich colors, textured brushstrokes, museum quality art, Renaissance inspired", emoji: "🖼️", gradient: "from-amber-700 to-orange-800" },
  { name: "Anime", prompt: "Japanese anime style, vibrant colors, expressive eyes, manga-inspired illustration, beautiful anime art", emoji: "⛩️", gradient: "from-indigo-500 to-pink-500" },
  { name: "Steampunk", prompt: "steampunk Victorian style, brass gears, clockwork mechanisms, retro-futuristic, industrial elegance", emoji: "⚙️", gradient: "from-amber-600 to-stone-700" },
  { name: "Mosaic", prompt: "ancient mosaic tile art style, colorful tessellated pieces, Byzantine mosaic aesthetic, detailed tile work", emoji: "🧩", gradient: "from-blue-600 to-teal-600" },
  { name: "Stained Glass", prompt: "stained glass window art, vibrant translucent colors, Gothic cathedral style, intricate leadwork patterns", emoji: "🏛️", gradient: "from-purple-500 to-amber-500" },
];

type Props = {
  onDescribe: (style: ImageStyle) => void;
  onUpload: (style: ImageStyle, file: File) => void;
};

const ImageStylePicker = ({ onDescribe, onUpload }: Props) => {
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedStyle) {
      onUpload(selectedStyle, file);
      setSelectedStyle(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="px-4 pb-3">
      <div className="max-w-3xl mx-auto">
        <AnimatePresence>
          {selectedStyle && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-3 glass rounded-xl p-4 border border-primary/20"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedStyle.emoji}</span>
                  <span className="font-semibold text-foreground">{selectedStyle.name} Style</span>
                </div>
                <button onClick={() => setSelectedStyle(null)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { onDescribe(selectedStyle); setSelectedStyle(null); }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Pencil className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">Describe</div>
                    <div className="text-xs text-muted-foreground">Type a person or character</div>
                  </div>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">Upload & Edit</div>
                    <div className="text-xs text-muted-foreground">Use a reference image</div>
                  </div>
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative group/gallery">
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center shadow-md opacity-0 group-hover/gallery:opacity-100 transition-opacity hover:bg-secondary"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-none py-1 px-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <button
              onClick={() => {
                setSelectedStyle({ name: "Custom Edit", prompt: "", emoji: "✏️", gradient: "from-gray-300 to-gray-500" });
              }}
              className="flex-shrink-0 w-24 flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="w-24 h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center hover:border-primary/40 hover:bg-primary/5 transition-all">
                <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors text-center">Edit an image</span>
            </button>

            {IMAGE_STYLES.map((style) => (
              <button
                key={style.name}
                onClick={() => setSelectedStyle(style)}
                className={`flex-shrink-0 w-24 flex flex-col items-center gap-2 group cursor-pointer ${
                  selectedStyle?.name === style.name ? "scale-105" : ""
                }`}
              >
                <div className={`w-24 h-32 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-105 relative overflow-hidden`}>
                  <span className="text-3xl drop-shadow-md">{style.emoji}</span>
                  {selectedStyle?.name === style.name && (
                    <div className="absolute inset-0 border-2 border-primary rounded-xl" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">{style.name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center shadow-md opacity-0 group-hover/gallery:opacity-100 transition-opacity hover:bg-secondary"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageStylePicker;