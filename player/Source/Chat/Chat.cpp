#include "Chat/Chat.h"

#include <algorithm>
#include <iterator>

namespace fieldbrik {
namespace {

// The 2008-2009 quick chat tree, in the order the menu listed it.
const Chat::Phrase kPhrases[] = {
    {L"Hello", L"Use the Chat menu to talk to me."},
    {L"Hello", L"I can only see menu chats."},
    {L"Hello", L"Hello"},
    {L"Hello", L"Hi"},
    {L"Hello", L"Hi there!"},
    {L"Hello", L"Hi everyone"},
    {L"Hello", L"Howdy"},
    {L"Hello", L"Howdy partner!"},
    {L"Hello", L"Greetings"},
    {L"Hello", L"Greetings everyone"},
    {L"Hello", L"Greetings Robloxians!"},
    {L"Hello", L"Seasons greetings!"},
    {L"Hello", L"Welcome"},
    {L"Hello", L"Welcome to my place"},
    {L"Hello", L"Welcome to our base"},
    {L"Hello", L"Welcome to my barbeque"},
    {L"Hello", L"Hey there!"},
    {L"Hello", L"What's up?"},
    {L"Hello", L"How are you doing?"},
    {L"Hello", L"How's it going?"},
    {L"Hello", L"What's new?"},
    {L"Hello", L"Good day"},
    {L"Hello", L"Good morning"},
    {L"Hello", L"Good afternoon"},
    {L"Hello", L"Good evening"},
    {L"Hello", L"Good night"},
    {L"Hello", L"Waaaaaaaz up?!"},
    {L"Hello", L"Hullo!"},

    {L"Farewell", L"Farewell"},
    {L"Farewell", L"Take care"},
    {L"Farewell", L"Have a nice day"},
    {L"Farewell", L"Goodluck!"},
    {L"Farewell", L"Ta-ta for now!"},
    {L"Farewell", L"Peace"},
    {L"Farewell", L"Peace out!"},
    {L"Farewell", L"Peace dudes!"},
    {L"Farewell", L"Rest in pieces!"},
    {L"Farewell", L"To the batcave!"},
    {L"Farewell", L"Over and out!"},
    {L"Farewell", L"Happy trails!"},
    {L"Farewell", L"I've got to book it!"},
    {L"Farewell", L"Tootles!"},
    {L"Farewell", L"Smell you later!"},
    {L"Farewell", L"GG!"},
    {L"Farewell", L"My house is on fire! gtg."},

    {L"Friend", L"Wanna be friends?"},
    {L"Friend", L"Follow me"},
    {L"Friend", L"Come to my place!"},
    {L"Friend", L"Come to my base!"},
    {L"Friend", L"Follow me, team!"},
    {L"Friend", L"Your place is cool"},
    {L"Friend", L"Your place is fun"},
    {L"Friend", L"Your place is awesome"},

    {L"Thanks", L"Thank you"},
    {L"Thanks", L"Thanks!"},
    {L"Thanks", L"No problem"},
    {L"Thanks", L"You're welcome"},

    {L"Good", L"Good"},
    {L"Good", L"Nice!"},
    {L"Good", L"Cool!"},
    {L"Good", L"Awesome"},
    {L"Good", L"Good job"},
    {L"Good", L"LOL"},
    {L"Good", L"ROFL"},

    {L"Bad", L"Bad"},
    {L"Bad", L"Aww..."},
    {L"Bad", L"That's not nice"},
    {L"Bad", L"Stop!"},

    {L"Yes", L"Yes"},
    {L"Yes", L"Yeah"},
    {L"Yes", L"OK"},
    {L"Yes", L"Sure"},

    {L"No", L"No"},
    {L"No", L"Nope"},
    {L"No", L"Never!"},

    {L"Uncertain", L"Maybe"},
    {L"Uncertain", L"Hmm..."},
    {L"Uncertain", L"I don't care"},
    {L"Uncertain", L"Not sure"},

    {L"Help", L"Help!"},
    {L"Help", L"Help me!"},
    {L"Help", L"Where are you?"},
    {L"Help", L"I'm stuck"},
};

}  // namespace

const std::vector<Chat::Phrase>& Chat::Phrases() {
  static const std::vector<Phrase> phrases(std::begin(kPhrases),
                                           std::end(kPhrases));
  return phrases;
}

void Chat::Tick(float seconds) {
  for (Line& line : lines_) line.age += seconds;

  lines_.erase(std::remove_if(lines_.begin(), lines_.end(),
                              [](const Line& line) { return line.age >= 11.0f; }),
               lines_.end());
}

void Chat::Add(const std::wstring& who, const std::wstring& text) {
  if (text.empty()) return;

  Line line;
  line.who = who;
  line.text = text;
  lines_.push_back(line);

  // A short log, the way the era's was: old lines fall off the top.
  constexpr size_t kMaxLines = 8;
  if (lines_.size() > kMaxLines) lines_.erase(lines_.begin());
}

void Chat::Scroll(int rows) {
  const int count = static_cast<int>(Phrases().size());
  if (count == 0) return;

  scroll_ += rows;
  if (scroll_ < 0) scroll_ = 0;
  if (scroll_ > count) scroll_ = count;
}

bool Chat::Submit() {
  if (!typing_) return false;

  const std::wstring text = buffer_;
  typing_ = false;
  buffer_.clear();

  if (text.empty()) return false;
  Add(L"You", text);
  return true;
}

void Chat::Type(const std::wstring& characters) {
  if (!typing_) return;
  for (wchar_t character : characters) {
    if (character >= 32 && character != 127) buffer_.push_back(character);
  }
}

void Chat::Backspace() {
  if (!typing_ || buffer_.empty()) return;
  buffer_.pop_back();
}

float Chat::LineAlpha(const Line& line) {
  // Eight seconds of reading time, then a three-second fade.
  if (line.age <= 8.0f) return 1.0f;
  const float fade = 1.0f - (line.age - 8.0f) / 3.0f;
  return fade < 0.0f ? 0.0f : fade;
}

}  // namespace fieldbrik
