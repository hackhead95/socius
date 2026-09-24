// Help menu dialogs: Getting started, Keyboard shortcuts, About Socius.
import { Modal } from '../ui/Modal';
import { FEEDBACK_URL, GUIDE_URL, SITE_URL } from './links';
import { BUILD_INFO } from '../platform/buildInfo';
import { openErrorLog, openFeedback } from '../features/errorlog/actions';
import { isMac } from './shortcuts';

export function GettingStartedDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Getting started" subtitle="Six steps from raw data to a results section." onClose={onClose} footer={<button className="btn btn-primary" onClick={onClose}>Done</button>}>
      <ol className="help-steps">
        <li>
          <strong>Open your data.</strong> Use File &gt; Open data file, or drag a file onto the window. SPSS files (.sav, .zsav) keep their variable labels, value labels, missing values and measurement levels. CSV and Excel files work too.
        </li>
        <li>
          <strong>Check the variables.</strong> In Variable View, make sure each variable has the right measure (nominal, ordinal or scale) and that codes like 8 = Don't know are declared as missing, so they are left out of statistics.
        </li>
        <li>
          <strong>Prepare what you need.</strong> The Transform menu recodes age into groups, reverse-codes negatively worded items, builds scales (with Cronbach's alpha) and computes new variables with SPSS-style formulas. Every step is logged in Output with its SPSS syntax, and Ctrl+Z undoes it.
        </li>
        <li>
          <strong>Run an analysis.</strong> For example, in the sample survey, Analyze &gt; Descriptive Statistics &gt; Crosstabs with gender in the rows and vote in the columns: the row percentages compare how many women and men voted. Results appear in Output with SPSS-style tables, a plain-language summary and an APA sentence.
        </li>
        <li>
          <strong>Code text.</strong> The Text coding menu imports interview transcripts or open-ended survey answers. Build a codebook, highlight passages, and count codes by respondent group. Optional AI help can suggest codes for you to review, and explain any result in plain language: everything AI does, and its set-up (AI &gt; AI assistant settings), is in the AI menu.
        </li>
        <li>
          <strong>Save and share.</strong> File &gt; Save project keeps data, output and codes together in one .socius.json file. Save data as SPSS .sav to continue in SPSS, and export output to Word from the Output tab.
        </li>
      </ol>
      <p className="help" style={{ marginTop: 12 }}>
        For step-by-step instructions with pictures, open the{' '}
        <a href={GUIDE_URL} target="_blank" rel="noopener noreferrer">user guide</a> (also under Help &gt; User guide).
      </p>
      <p className="help" style={{ marginTop: 6 }}>Your data stays in this browser. Nothing is uploaded.</p>
    </Modal>
  );
}

export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  const mod = isMac() ? 'Cmd' : 'Ctrl';
  // Keys are written in [brackets]; other words are plain text.
  const groups: Array<{ title: string; rows: Array<[string, string]> }> = [
    {
      title: 'Everywhere',
      rows: [
        [`[${mod}+K] or [/]`, 'Search commands, variables, results and help'],
        [`[${mod}+J]`, 'Open or close the Socius assistant (AI menu)'],
        [`[${mod}+Z]`, 'Undo, in the tab you are in: in Text coding the last coding change; in Output the last deleted result (otherwise the last data change); in Data View and Variable View the last data change. Edit > Undo names what it will undo. While you type in a box, it undoes your typing.'],
        [`[${mod}+Y] or [${mod}+Shift+Z]`, 'Redo, in the same way'],
        [`[${mod}+O]`, 'Open a data file'],
        [`[${mod}+S]`, 'Save the project'],
        ['[Esc]', 'Close a dialog or menu'],
      ],
    },
    {
      title: 'Data View',
      rows: [
        ['[↑] [↓] [←] [→]', 'Move between cells'],
        ['[Shift] + arrow', 'Extend the selection'],
        ['[Tab] / [Shift+Tab]', 'Next / previous variable'],
        ['[Enter]', 'Move down (or save the value you typed)'],
        ['Type any character', 'Start editing the cell'],
        ['[F2] or double-click', 'Edit the current value'],
        ['[Esc] while editing', 'Cancel the edit'],
        ['[Delete]', 'Clear the selected cells'],
        [`[${mod}+C] / [${mod}+V]`, 'Copy / paste cells (works with Excel)'],
        [`[${mod}+A]`, 'Select all cells'],
        [`[${mod}+F]`, 'Find a value or label'],
        ['[Home] / [End]', 'First / last variable'],
        [`[${mod}+Home] / [${mod}+End]`, 'First / last case'],
        ['[Page Up] / [Page Down]', 'Scroll one screen'],
      ],
    },
    {
      title: 'Variable View',
      rows: [
        ['[Enter] or [F2]', 'Edit the property (opens a dialog for Type, Values, Missing)'],
        ['Click the row number', 'Select a variable; hold [Shift] or [Ctrl] to select several'],
        ['Drag the row number', 'Move a variable'],
      ],
    },
    {
      title: 'Text coding: Responses view',
      rows: [
        ['[j] / [k] or [↑] [↓]', 'Move between responses'],
        ['[x] or [Space]', 'Select a response'],
        ['[1] to [9]', 'Apply or remove one of the first nine codes'],
        ['[/]', 'Find a code for the response (here [/] does not open Search)'],
        ['[o] or [Enter]', 'Open the response in the reading view'],
      ],
    },
    {
      title: 'Menus',
      rows: [
        ['[↑] [↓] [←] [→]', 'Move through menus'],
        ['First letter', 'Jump to an item'],
      ],
    },
  ];
  const renderKeys = (text: string) =>
    text.split(/(\[[^\]]+\])/).filter(Boolean).map((part, i) =>
      part.startsWith('[') ? <kbd key={i} className="kbd">{part.slice(1, -1)}</kbd> : <span key={i}>{part}</span>,
    );
  return (
    <Modal title="Keyboard shortcuts" onClose={onClose} footer={<button className="btn btn-primary" onClick={onClose}>Done</button>}>
      <div className="stack">
        {groups.map((g) => (
          <section key={g.title}>
            <h3 className="eyebrow" style={{ marginBottom: 6 }}>{g.title}</h3>
            <table className="table shortcut-table">
              <tbody>
                {g.rows.map(([k, d]) => (
                  <tr key={k}>
                    <td style={{ width: '42%' }} className="shortcut-keys">{renderKeys(k)}</td>
                    <td>{renderKeys(d)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </Modal>
  );
}

export function AboutDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="About Socius" subtitle={`Version ${BUILD_INFO.label}`} onClose={onClose} footer={<button className="btn btn-primary" onClick={onClose}>Close</button>}>
      <div className="stack about">
        <p>Socius is a research workbench for sociologists: survey data, statistics and qualitative coding in one place, in the browser.</p>
        <section>
          <h3 className="eyebrow">Privacy</h3>
          <p>Your data stays in this browser. Files you open are read on this computer and nothing is uploaded. Your working session is kept in this browser's storage so you can pick up where you left off; clear it with File &gt; Close data and start fresh.</p>
          <p>
            AI help is optional and off until you set it up in <b>AI &gt; AI assistant settings</b>. It only sends what you choose, when you click, to the provider you choose. With the on-device option nothing leaves your computer.
          </p>
        </section>
        <section>
          <h3 className="eyebrow">Help and feedback</h3>
          <ul>
            <li><a href={GUIDE_URL} target="_blank" rel="noopener noreferrer">User guide</a></li>
            <li><a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.preventDefault(); openFeedback(); }}>Send feedback or report a problem</a> (a form on GitHub)</li>
            <li>Something not working? <button type="button" className="linkish" onClick={openErrorLog}>Help &gt; Error log</button> lists what went wrong, to copy into your report.</li>
            <li>Website: <a href={SITE_URL} target="_blank" rel="noopener noreferrer">{SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a></li>
          </ul>
        </section>
        <section>
          <h3 className="eyebrow">Working with SPSS</h3>
          <ul>
            <li>Opens .sav and .zsav files with variable and value labels, missing values, measurement levels, dates and long string variables.</li>
            <li>Saves .sav (compressed) and .zsav files that SPSS and PSPP open. SPSS allows at most 3 discrete missing values per variable.</li>
            <li>Transformations follow SPSS COMPUTE, RECODE and SELECT IF rules, including missing values (arithmetic with a missing value is missing; MEAN.n needs n valid values). Each step shows its SPSS syntax in Output.</li>
            <li>Weights work like WEIGHT BY (frequency weights, decimals allowed). Filters work like FILTER BY.</li>
            <li>Random samples use their own generator, so the cases picked differ from SPSS even with the same seed.</li>
          </ul>
        </section>
      </div>
    </Modal>
  );
}
