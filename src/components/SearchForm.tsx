import * as React from 'react';
import { Characters, Stages, CharacterStrings, StageStrings, moves } from '../static/meleeIds';
import { TextField, Button, Checkbox, Box, FormControlLabel, Select, FormControl, Autocomplete, MenuItem, Grid, CircularProgress } from '@mui/material';
import ConversionDataGrid from './ConversionDataGrid';
import Database from '../scripts/database'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import 'react-datepicker/dist/react-datepicker-cssmodules.css'
import { parseISO } from 'date-fns';
const db = Database.GetInstance();
export class SearchForm extends React.Component<any, any> {
  newMaxPageNumber: number;
  characters: any;
  stages: any;
  moves: any;
  constructor(props: any) {
    super(props)
    let fields = ['playList', 'playReplay', 'startAt', 'attackingPlayer', 'attackingCharacter', 'defendingPlayer', 'defendingCharacter', 'stage', 'percent', 'time', 'didKill', 'moveCount']
    this.state = {
      attackingPlayerCode: null,
      attackingCharacter: '',
      defendingPlayerCode: null,
      defendingCharacter: '',
      stage: '',
      didKill: false,
      zeroToDeath: false,
      excludeAssigned: false,
      minimumDamage: '',
      maximumDamage: '',
      minimumMove: '',
      maximumMove: '',
      beforeDate: '',
      afterDate: '',
      conversions: [],
      pageNumber: 0,
      maxPageNumber: undefined,
      sortField: 'startAt',
      sortDir: 'desc',
      fields: fields,
      conversionCount: undefined,
      pageSize: 10,
      comboContains: [],
      comboStartsWith: [],
      comboEndsWith: [],
      dbAttackingPlayerList: [],
      dbAttackingPlayerOpen: false,
      dbDefendingPlayerList: [],
      dbDefendingPlayerOpen: false,
      comboMoves: [],
      status: 'Please search for conversions',
    }
    this.newMaxPageNumber = 0;
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleAutocompleteInputChange = this.handleAutocompleteInputChange.bind(this);
    this.getConversions = this.getConversions.bind(this);
    this.handlePageSize = this.handlePageSize.bind(this);
    this.handleSortModelChange = this.handleSortModelChange.bind(this);
    this.clearConversions = this.clearConversions.bind(this)
    this.onPlayerDropdownLoad = this.onPlayerDropdownLoad.bind(this);
    this.characters = [];
    for (const character in Characters) {
      this.characters.push({
        //@ts-ignore
        value: Characters[character],
        label: character
      })
    }

    this.stages = [];
    for (const stage in Stages) {
      this.stages.push({
        //@ts-ignore
        value: Stages[stage],
        label: stage
      })
    }

    this.moves = [];
    for (const moveId in moves) {
      this.moves.push({
        value: parseInt(moveId) + 1,
        label: moves[moveId].name
      })
    }

    // ipcRenderer.on('updatePlayerList', async (event, message) => {
    //   console.log(message);
    // })
  }

  handleInputChange(event: any) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: value
    });
  }

  handleAutocompleteInputChange(value: any, name: any) {
    let stateValue = value?.value || value || null;
    this.setState({
      [name]: stateValue
    })
  }

  handleDateChange(date: Date, name: string) {
    this.setState({
      [name]: date
    });
  }

  clearConversions() {
    this.setState({
      conversions: []
    })
  }

  getConversions() {
    let offset = (this.state.pageNumber) * this.state.pageSize;

    //TODO build query better
    //dynamic search solution
    let queryObject: any = {};
    let whereString = 'WHERE 1=1';
    if (this.state.attackingPlayerCode && this.state.attackingPlayerCode != '') {
      whereString += ' AND attackingPlayer = @attackingPlayerCode'
      queryObject.attackingPlayerCode = this.state.attackingPlayerCode;
    };
    if ((this.state.attackingCharacter != '' || this.state.attackingCharacter === 0) && parseInt(this.state.attackingCharacter)) {
      whereString += ' AND attackingCharacter = @attackingCharacter'
      //parseint needed for sqlite comparison
      queryObject.attackingCharacter = parseInt(this.state.attackingCharacter);
    };
    if (this.state.defendingPlayerCode && this.state.defendingPlayerCode != '') {
      whereString += ' AND defendingPlayer = @defendingPlayerCode'
      queryObject.defendingPlayerCode = this.state.defendingPlayerCode;
    };
    if ((this.state.defendingCharacter != '' || this.state.defendingCharacter === 0) && parseInt(this.state.defendingCharacter)) {
      whereString += ' AND defendingCharacter = @defendingCharacter'
      queryObject.defendingCharacter = parseInt(this.state.defendingCharacter);
    };
    if (this.state.stage != '' && this.state.stage) {
      whereString += ' AND stage = @stage'
      queryObject.stage = parseInt(this.state.stage);
    };
    if (this.state.minimumDamage) {
      whereString += ' AND percent >= @minimumDamage'
      queryObject.minimumDamage = parseInt(this.state.minimumDamage);
    };
    if (this.state.maximumDamage) {
      whereString += ' AND percent <= @maximumDamage';
      queryObject.maximumDamage = parseInt(this.state.maximumDamage);
    }
    if (this.state.minimumMove) {
      whereString += ' AND moveCount >= @minimumMoveCount';
      queryObject.minimumMoveCount = parseInt(this.state.minimumMove);
    }
    if (this.state.maximumMove) {
      whereString += ' AND moveCount <= @maximumMoveCount';
      queryObject.maximumMoveCount = parseInt(this.state.maximumMove);
    }
    if (this.state.didKill) {
      whereString += ' AND didKill = 1'
      //special case cause sqlite doesnt store true/false?
    };
    if (this.state.excludeAssigned) {
      whereString += ' AND id NOT IN (SELECT conversionId from playlistconversion)'
    }
    if (this.state.zeroToDeath) {
      whereString += ' AND zeroToDeath = 1'
    }
    if (this.state.afterDate) {
      let dateRegEx = /^[^T]*/
      let isoDate = this.state.afterDate.toISOString();
      let dateString = dateRegEx.exec(isoDate)?.[0];
      whereString += ' AND date >= @afterDate';
      queryObject.afterDate = dateString;
    }
    if (this.state.beforeDate) {
      let dateRegEx = /^[^T]*/
      let isoDate = this.state.beforeDate.toISOString();
      let dateString = dateRegEx.exec(isoDate)?.[0];
      whereString += ' AND date <= @beforeDate';
      queryObject.beforeDate = dateString;
    }
    if (this.state.comboMoves.length > 0) {
      let values = this.state.comboMoves.map((x: any) => parseInt(x.value))
      for (let i = 0; i < values.length; i++) {
        whereString += ` AND id in (SELECT conversionId FROM moves WHERE moveId = @moveId${i})`;
        queryObject[`moveId${i}`] = values[i];
      }
    }
    if (this.state.comboContains.length > 0) {
      //no judgement zone
      let value = '%,' + this.state.comboContains.map((x: any) => x.value).join(',') + ',%';
      whereString += ' AND moveString LIKE @moveString'
      queryObject.moveString = value;
    }
    if (this.state.comboStartsWith.length > 0) {
      let values = this.state.comboStartsWith.map((x: any) => parseInt(x.value))
      for (let i = 0; i < values.length; i++) {
        whereString += ` AND id IN (SELECT conversionId FROM moves WHERE moveId = @startId${i} AND moveIndex = @startIndex${i})`
        queryObject[`startId${i}`] = values[i];
        queryObject[`startIndex${i}`] = i;
      }
    }
    if (this.state.comboEndsWith.length > 0) {
      let values = this.state.comboEndsWith.map((x: any) => parseInt(x.value)).reverse()
      for (let i = 0; i < values.length; i++) {
        whereString += ` AND id IN (SELECT conversionId FROM moves WHERE moveId = @endId${i} AND inverseMoveIndex = @endIndex${i})`
        queryObject[`endId${i}`] = values[i];
        queryObject[`endIndex${i}`] = i;
      }
    }
    //is there a better way to get the count?
    let query = `WITH cte AS(SELECT count(*) total FROM conversions ${whereString}) SELECT *, (select total from cte) as total FROM conversions ${whereString}`;
    query += ` ORDER BY ${this.state.sortField} ${this.state.sortDir} LIMIT ${this.state.pageSize} OFFSET ${offset}`
    queryObject = queryObject ? queryObject : ''
    let startTime = Date.now();
    console.log(query);
    console.log(queryObject);
    let prepQuery = db.prepare(query);
    let searchConversions = queryObject ? prepQuery.all(queryObject) : prepQuery.all();
    let maxPageCount = searchConversions.length > 0 ? Math.ceil(searchConversions[0].total / this.state.pageSize) : 1;
    this.setState({ conversions: searchConversions, maxPageNumber: maxPageCount, conversionCount: searchConversions[0]?.total || 0 }, () => {
      console.log(Date.now() - startTime);
    });

  }


  setPage(pageNumber: any, event: any = null) {
    event?.preventDefault()
    this.setState({ pageNumber: pageNumber },
      () => this.getConversions())
  }

  handleSortModelChange(event: any) {
    this.setState({ sortDir: event[0].sort, sortField: event[0].field },
      () => this.getConversions())
  }

  handlePageSize(newPageSize: any) {
    this.setState({ pageSize: newPageSize },
      () => this.getConversions())
  }

  //this could be rewritten to use an invisible window to fetch stuff in background
  //AttackingPlayer || DefendingPlayer
  onPlayerDropdownLoad(dropdown: string) {
    if (dropdown != 'AttackingPlayer' && dropdown != 'DefendingPlayer') { throw `Bad onPlayerDropdownLoad parameter - ${dropdown}` }
    let dbPlayerListState = `db${dropdown}List`
    let openState = `db${dropdown}Open`

    this.setState({ [openState]: true }, () => {
      if (this.state[dbPlayerListState].length === 0) {
        //necessary for loading icon to show
        (async () => {
          await sleep(1e1);
          let players = db.prepare(`SELECT ${dropdown} FROM conversions GROUP BY ${dropdown} ORDER BY COUNT(*) DESC`).pluck().all().filter((x: any) => x);
          this.setState({ [dbPlayerListState]: players })
        })();
      }
    })

  }
  render() {
    let attackPlayerLoading = (this.state.dbAttackingPlayerList.length === 0 && this.state.dbAttackingPlayerOpen)
    let defendPlayerLoading = (this.state.dbDefendingPlayerList.length === 0 && this.state.dbDefendingPlayerOpen)

    return (
      <div>
        <Box onSubmit={(e: any) => this.setPage(0, e)}
          component="form"
          sx={{
            '& .MuiTextField-root': { m: 1, width: '25ch' }
          }}
          noValidate
          autoComplete="off"
        >
          {this.state.conversions?.length <= 0 &&
            <span>
              <Grid container >
                <Grid item>
                  <Autocomplete
                    autoSelect={true}
                    //@ts-ignore
                    name="attackingPlayerCode"
                    options={this.state.dbAttackingPlayerList}
                    open={this.state.dbAttackingPlayerOpen}
                    loading={attackPlayerLoading}
                    onOpen={() => { this.onPlayerDropdownLoad('AttackingPlayer') }}
                    onClose={() => { this.setState({ dbAttackingPlayerOpen: false }) }}
                    value={this.state.attackingPlayerCode}
                    renderInput={(params) => (
                      <TextField {...params} label="Attacking Player Code" variant="standard"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <React.Fragment>
                              {attackPlayerLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </React.Fragment>
                          ),
                        }}
                      />
                    )
                    }
                    onChange={(event, value) => this.handleAutocompleteInputChange(value, 'attackingPlayerCode')}
                    getOptionLabel={(option) => {
                      return option
                    }}
                  />
                </Grid>
                <Grid item>
                  <Autocomplete
                    autoSelect={true}
                    //@ts-ignore
                    name="attackingCharacter"
                    options={this.characters}
                    renderInput={(params) => (<TextField {...params} label="Attacking Character" variant="standard" />)}
                    onChange={(event, value) => this.handleAutocompleteInputChange(value, 'attackingCharacter')}
                    isOptionEqualToValue={(option: any, value: any) => option.value === value.value}
                  />
                </Grid>
              </Grid>
              <Grid container >
                <Autocomplete
                  autoSelect={true}
                  //@ts-ignore
                  name="defendingPlayerCode"
                  options={this.state.dbDefendingPlayerList}
                  open={this.state.dbDefendingPlayerOpen}
                  loading={defendPlayerLoading}
                  onOpen={() => { this.onPlayerDropdownLoad('DefendingPlayer') }}
                  onClose={() => { this.setState({ dbDefendingPlayerOpen: false }) }}
                  value={this.state.defendingPlayerCode}
                  renderInput={(params) => (
                    <TextField {...params} label="Defending Player Code" variant="standard"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <React.Fragment>
                            {defendPlayerLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </React.Fragment>
                        ),
                      }}
                    />
                  )
                  }
                  onChange={(event, value) => this.handleAutocompleteInputChange(value, 'defendingPlayerCode')}
                  getOptionLabel={(option) => {
                    return option
                  }}
                />
                <Grid item>
                  <Autocomplete
                    autoSelect={true}
                    //@ts-ignore
                    name="defendingCharacter"
                    options={this.characters}
                    renderInput={(params) => (<TextField {...params} label="Defending Character" variant="standard" />)}
                    onChange={(event, value) => this.handleAutocompleteInputChange(value, 'defendingCharacter')}
                    isOptionEqualToValue={(option: any, value: any) => option.value === value.value}
                  />
                </Grid>
              </Grid>
              <Autocomplete
                autoSelect={true}
                //@ts-ignore
                name="stage"
                options={this.stages}
                renderInput={(params) => (<TextField {...params} label="Stage" variant="standard" />)}
                onChange={(event, value) => this.handleAutocompleteInputChange(value, 'stage')}
                isOptionEqualToValue={(option: any, value: any) => option.value === value.value}
              />
              <div>
                <FormControlLabel control={<Checkbox />} label="Did Combo Kill?" onChange={this.handleInputChange} name="didKill" checked={this.state.didKill} />
                <FormControlLabel control={<Checkbox />} label="Zero to Death?" onChange={this.handleInputChange} name="zeroToDeath" checked={this.state.zeroToDeath} />

              </div>
              <div>
                <TextField label="Minimum damage done" type="number" placeholder="Minimum %" onChange={this.handleInputChange} name="minimumDamage" value={this.state.minimumDamage} />
                <TextField label="Maximum damage done" type="number" placeholder="Max %" onChange={this.handleInputChange} name="maximumDamage" value={this.state.maximumDamage} />
              </div>
              <div>
                <TextField label="Minimum move count" type="number" placeholder="Minimum moves in combo" onChange={this.handleInputChange} name="minimumMove" value={this.state.minimumMove} />
                <TextField label="Maximum move count" type="number" placeholder="Max moves in combo" onChange={this.handleInputChange} name="maximumMove" value={this.state.maximumMove} />
              </div>
              <div>
                <FormControlLabel control={<Checkbox />} label="Exclude assigned conversions?" onChange={this.handleInputChange} name="excludeAssigned" checked={this.state.excludeAssigned} />
              </div>
              <div>
                Game is AFTER date: <DatePicker selected={this.state.afterDate} onChange={(date:Date) => this.handleDateChange(date, 'afterDate')} name='afterDate'/>
                Game is BEFORE date: <DatePicker selected={this.state.beforeDate} onChange={(date:Date) => this.handleDateChange(date, 'beforeDate')} name='beforeDate'/>
              </div>
              <div>
                <Autocomplete
                  multiple
                  options={this.moves}
                  getOptionLabel={(item) => item.label}
                  renderInput={(params) => (<TextField {...params} label="Combo contains move(s)" variant="standard" />)}
                  onChange={(event, value, reason, details) => this.handleAutocompleteInputChange(value, 'comboMoves')}
                  disableCloseOnSelect={true}
                  defaultValue={this.state.comboMoves}
                  value={this.state.comboMoves}
                />
              </div>
              {/* these will throw warnings but its okay
                  forcing isOptionEqualToValue = false
                  lets users select the same option multiple times */}
              <Grid container >
                <Grid item>
                  <Autocomplete
                    multiple
                    options={this.moves}
                    getOptionLabel={(item) => item.label}
                    renderInput={(params) => (<TextField {...params} label="Combo contains string" variant="standard" />)}
                    onChange={(event, value) => this.handleAutocompleteInputChange(value, 'comboContains')}
                    isOptionEqualToValue={() => false}
                    disableCloseOnSelect={true}
                    defaultValue={this.state.comboContains}
                  />
                </Grid>
                <Grid item>
                  <Autocomplete
                    multiple
                    options={this.moves}
                    getOptionLabel={(item) => item.label}
                    renderInput={(params) => (<TextField {...params} label="Combo starts with string" variant="standard" />)}
                    onChange={(event, value, reason, details) => this.handleAutocompleteInputChange(value, 'comboStartsWith')}
                    isOptionEqualToValue={(option, value) => false}
                    disableCloseOnSelect={true}
                    defaultValue={this.state.comboStartsWith}
                  />
                </Grid>
                <Grid item>
                  <Autocomplete
                    multiple
                    options={this.moves}
                    getOptionLabel={(item) => item.label}
                    renderInput={(params) => (<TextField {...params} label="Combo ends with string" variant="standard" />)}
                    onChange={(event, value, reason, details) => this.handleAutocompleteInputChange(value, 'comboEndsWith')}
                    isOptionEqualToValue={(option, value) => false}
                    disableCloseOnSelect={true}
                    defaultValue={this.state.comboEndsWith}
                  />
                </Grid>
              </Grid >

              <Button type="submit" variant="contained">Search Conversions</Button>
            </span>
          }
          {this.state.conversions.length > 0
            ? <div>
              <Button variant="contained" onClick={() => this.clearConversions()}>Go back to search</Button>
              <div style={{ height: '900px', width: '100%' }} id='ConversionTable'>
                <ConversionDataGrid data={this.state.conversions} maxCount={this.state.conversionCount} handlePageChange={(pageNumber: any) => this.setPage(pageNumber)}
                  handleSortModelChange={(e: any) => this.handleSortModelChange(e)} handlePageSize={(newPageSize: any) => this.handlePageSize(newPageSize)} pageSize={this.state.pageSize}
                  sortModel={[{ field: this.state.sortField, sort: this.state.sortDir }]}
                />
              </div>
            </div>
            : <div> {this.state.status}</div>
          }
        </Box>
      </div>
    );
  }
}



function sleep(delay = 0) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}
