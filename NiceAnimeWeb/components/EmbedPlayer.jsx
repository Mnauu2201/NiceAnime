// FILE: components/EmbedPlayer.jsx
'use client'; 

import React from 'react';

// Component này bọc thẻ iframe để hiển thị video embed
export default function EmbedPlayer({ videoUrl, ...props }) {
    if (!videoUrl) return null;
    
    // Thẻ iframe hiển thị link nhúng (embed link)
    return (
        <iframe 
            src={videoUrl}
            title="Video Player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            // Áp dụng style từ props (bao gồm vị trí và kích thước tuyệt đối)
            {...props} 
        />
    );
}