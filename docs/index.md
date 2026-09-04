---
hide:
  - navigation
  - toc
---

<div class="home">

<header class="home__hero">

<span class="eyebrow" translate="no">S_Enchant.ini &middot; effect 52124</span>

<h1>Every column, read from the binary.</h1>

<p class="lead">Column-by-column reference for the server&rsquo;s data files, written from the decompiled server binaries and checked against real data. Each article names the function that reads each column, says what the value does at runtime, and lists what stops the server from booting.</p>

<figure class="rowstrip">
  <div class="rowstrip__scroll" tabindex="0" role="img" aria-label="One row of S_Enchant.ini, fields one to twenty-four: 52124, E0124, four empty fields, 1, 524288, two empty fields, then command slot 2036 with its fourth parameter set to -80, then command slot 2095 with its third parameter set to 10. Thirty-nine further fields follow.">
    <div class="rowstrip__fields" translate="no">
      <span class="f f--key"><i>01</i><b>52124</b></span>
      <span class="f"><i>02</i><b>E0124</b></span>
      <span class="f"><i>03</i><b>&nbsp;</b></span>
      <span class="f"><i>04</i><b>&nbsp;</b></span>
      <span class="f"><i>05</i><b>&nbsp;</b></span>
      <span class="f"><i>06</i><b>&nbsp;</b></span>
      <span class="f"><i>07</i><b>1</b></span>
      <span class="f f--key"><i>08</i><b>524288</b></span>
      <span class="f"><i>09</i><b>&nbsp;</b></span>
      <span class="f"><i>10</i><b>&nbsp;</b></span>
      <span class="f f--slot f--slot-start f--key"><i>11</i><b>2036</b></span>
      <span class="f f--slot"><i>12</i><b>&nbsp;</b></span>
      <span class="f f--slot"><i>13</i><b>&nbsp;</b></span>
      <span class="f f--slot"><i>14</i><b>&nbsp;</b></span>
      <span class="f f--slot f--key"><i>15</i><b>-80</b></span>
      <span class="f f--slot"><i>16</i><b>&nbsp;</b></span>
      <span class="f f--slot f--slot-end"><i>17</i><b>&nbsp;</b></span>
      <span class="f f--slot f--slot-start"><i>18</i><b>2095</b></span>
      <span class="f f--slot"><i>19</i><b>&nbsp;</b></span>
      <span class="f f--slot"><i>20</i><b>&nbsp;</b></span>
      <span class="f f--slot"><i>21</i><b>10</b></span>
      <span class="f f--slot"><i>22</i><b>&nbsp;</b></span>
      <span class="f f--slot"><i>23</i><b>&nbsp;</b></span>
      <span class="f f--slot f--slot-end"><i>24</i><b>&nbsp;</b></span>
      <span class="f f--more"><i>&nbsp;</i><b>+39</b></span>
    </div>
  </div>
  <figcaption class="rowstrip__caption">One row of <code translate="no">S_Enchant.ini</code>: 63&nbsp;fields separated by <code translate="no">|</code>, with no header row, so position is the only thing that names them. The two shaded blocks are command slots &mdash; an id followed by its six parameters, every seven&nbsp;fields. This row uses two of the four.</figcaption>
</figure>

<ul class="legend">
  <li><span class="col">01</span><span>The effect id. Other files point at effects by this number.</span></li>
  <li><span class="col">08</span><span><code translate="no">EnchantFlag</code>. <code>524288</code> is <code>0x80000</code>: the effect is stripped when the character rebirths.</span></li>
  <li><span class="col">11</span><span>A command id. <code>2036</code> builds a damage shield.</span></li>
  <li><span class="col">15</span><span>That command&rsquo;s <code translate="no">p4</code> &mdash; the only parameter it reads. Here, the size of the shield.</span></li>
</ul>

</header>

<section class="home__section">

<h2>The files</h2>

<p class="note">One article per file, column by column. Every article says where each claim came from and what it could not prove.</p>

<ul class="idx">
  <li>
    <a class="idx__row" href="server/S_DropItem/">
      <span class="idx__file" translate="no">S_DropItem.ini</span>
      <span class="idx__what">Loot tables: monster drops, bag contents, gold, affix quality, part-break drops and server-wide announcements.</span>
      <span class="idx__facts"><span>194&nbsp;columns</span><span>roll formula</span><span>boot killers</span></span>
      <span class="idx__go" aria-hidden="true">&rarr;</span>
    </a>
  </li>
  <li>
    <a class="idx__row" href="server/S_Enchant/">
      <span class="idx__file" translate="no">S_Enchant.ini</span>
      <span class="idx__what">Effects: buffs, debuffs, passives and procs. The loader, exclusion groups, stacking, the flag bits and the transition child.</span>
      <span class="idx__facts"><span>63&nbsp;columns</span><span>23&nbsp;flag bits</span><span>boot killers</span></span>
      <span class="idx__go" aria-hidden="true">&rarr;</span>
    </a>
  </li>
  <li>
    <a class="idx__row" href="server/S_Enchant_Commands/">
      <span class="idx__file" translate="no">S_Enchant commands</span>
      <span class="idx__what">The command vocabulary behind those effects: what each numeric id emits, which stream it runs in, and what it changes.</span>
      <span class="idx__facts"><span>283&nbsp;ids</span><span>247&nbsp;commands</span><span>222&nbsp;boot killers</span></span>
      <span class="idx__go" aria-hidden="true">&rarr;</span>
    </a>
  </li>
  <li>
    <div class="idx__row idx__row--planned">
      <span class="idx__file" translate="no">S_Monster.ini</span>
      <span class="idx__what">Monster templates: stats, spells, AI hooks, alignment and part breaking.</span>
      <span class="idx__facts"><span>not started</span></span>
      <span class="tag-planned">Planned</span>
    </div>
  </li>
</ul>

</section>

<section class="home__section">

<h2>Why you can check it</h2>

<ul class="proofs">
  <li>
    <h3>Addresses, not adjectives</h3>
    <p>Values like <code>@0x786ba0</code> are ZoneServer addresses. Every claim points at the code it came from, so you can open the binary and disagree with it.</p>
  </li>
  <li class="is-fail">
    <h3>Boot killers, collected</h3>
    <p>Anything that makes the server refuse to start with <code>[FAIL] Database Error!!</code> is listed per file &mdash; including the checks that fail without writing a single line to the log.</p>
  </li>
  <li>
    <h3>Gaps are marked</h3>
    <p>Where something could not be proven in the binary, the page says <code>not verified</code> and names what was searched, instead of guessing.</p>
  </li>
</ul>

</section>

<section class="home__section">

<h2>Conventions</h2>

<dl class="conv">
  <div>
    <dt>Columns</dt>
    <dd>1-based unless marked <code translate="no">idx</code>. Field names come from the binary&rsquo;s debug symbols; the files themselves have no header row.</dd>
  </div>
  <div>
    <dt>Addresses</dt>
    <dd><code>@0x&hellip;</code> values are ZoneServer addresses, given so every claim can be re-checked in a disassembler.</dd>
  </div>
  <div>
    <dt>Units</dt>
    <dd>Every duration is in tenths of a second unless a page says otherwise. Percentages are not consistent between commands, so each entry states its own scale.</dd>
  </div>
  <div>
    <dt>Dead columns</dt>
    <dd>Parsed by the loader and read by nothing. Editing them does nothing at all.</dd>
  </div>
</dl>

</section>

</div>
