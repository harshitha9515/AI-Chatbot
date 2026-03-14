import { useState, useEffect } from "react";
import {
  MoreHorizontal,
  Pin,
  Pencil,
  Trash2,
  Share2,
  LogOut,
  Plus,
} from "lucide-react";

/* ================================
   TYPES
================================ */
export interface Conversation {
  id: string;
  title: string;
  pinned: boolean;
}

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggle: () => void;
}

/* ================================
   CHAT ITEM
================================ */
const ChatItem = ({
  conv,
  activeId,
  onSelect,
  onRename,
  onPin,
  onDelete,
}: {
  conv: Conversation;
  activeId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const renameChat = () => {
    const name = prompt("Rename chat", conv.title);
    if (name) onRename(conv.id, name);
  };

  const shareChat = () => {
    const link = `${window.location.origin}/chat/${conv.id}`;
    navigator.clipboard.writeText(link);
    alert("Share link copied!");
  };

  return (
    <div
      className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer
      ${
        activeId === conv.id
          ? "bg-gray-200 dark:bg-gray-700"
          : "hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      <span onClick={() => onSelect(conv.id)} className="truncate flex-1">
        {conv.title}
      </span>

      <div className="relative">
        <MoreHorizontal
          size={18}
          className="opacity-0 group-hover:opacity-100 cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
        />

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-44
            bg-white dark:bg-gray-900
            border dark:border-gray-700
            rounded-lg shadow-lg z-50"
          >
            <button
              onClick={() => {
                onPin(conv.id, !conv.pinned);
                setMenuOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Pin size={16} />
              {conv.pinned ? "Unpin" : "Pin"}
            </button>

            <button
              onClick={() => {
                renameChat();
                setMenuOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Pencil size={16} />
              Rename
            </button>

            <button
              onClick={() => {
                shareChat();
                setMenuOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Share2 size={16} />
              Share Link
            </button>

            <button
              onClick={() => {
                onDelete(conv.id);
                setMenuOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ================================
   SIDEBAR
================================ */
const ChatSidebar = ({
  conversations,
  activeId,
  onSelect,
  onRename,
  onPin,
  onDelete,
  onNew,
  onLogout,
}: Props) => {

  /* ✅ THEME TOGGLE ADDED */
  const [dark, setDark] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  const pinnedChats = conversations.filter(c => c.pinned);
  const recentChats = conversations.filter(c => !c.pinned);

  return (
    <div
      className="
      w-72 flex flex-col h-screen
      bg-white dark:bg-gray-900
      text-gray-900 dark:text-white
      border-r border-gray-200 dark:border-gray-700
      "
    >

      {/* HEADER */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex gap-2">

        <button
          onClick={onNew}
          className="flex items-center gap-2 flex-1
          bg-gray-100 dark:bg-gray-800
          hover:bg-gray-200 dark:hover:bg-gray-700
          p-2 rounded-lg"
        >
          <Plus size={18} />
          New Chat
        </button>

        {/* ✅ THEME TOGGLE BUTTON */}
        <button
          onClick={() => setDark(!dark)}
          className="px-3 rounded-lg bg-gray-100 dark:bg-gray-800"
        >
          {dark ? "☀️" : "🌙"}
        </button>

      </div>

      {/* CHAT LIST */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">

        {pinnedChats.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 px-2 mb-2">
              📌 Pinned
            </p>

            {pinnedChats.map(conv => (
              <ChatItem
                key={conv.id}
                conv={conv}
                activeId={activeId}
                onSelect={onSelect}
                onRename={onRename}
                onPin={onPin}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}

        <div>
          <p className="text-xs text-gray-500 px-2 mb-2">
            Chats
          </p>

          {recentChats.map(conv => (
            <ChatItem
              key={conv.id}
              conv={conv}
              activeId={activeId}
              onSelect={onSelect}
              onRename={onRename}
              onPin={onPin}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-red-500"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;