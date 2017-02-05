Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',

    requires: [
        'IterationColumn'
    ],

    scopeType: 'release',
    supportsUnscheduled: false,

    onScopeChange: function() {
        var context = this.getContext(),
            release = context.getTimeboxScope().getRecord(),
            startDate = release.get('ReleaseStartDate'),
            endDate = release.get('ReleaseDate');

        Ext.create('Rally.data.wsapi.Store', {
            model: 'Iteration',
            context: context.getDataContext(),
            filters: [
                {
                    property: 'StartDate',
                    operator: '>=',
                    value: Rally.util.DateTime.toIsoString(startDate)
                },
                {
                    property: 'EndDate',
                    operator: '<=',
                    value: Rally.util.DateTime.toIsoString(endDate)
                }
            ],
            sorters: [
                {
                    propety: 'StartDate',
                    direction: 'ASC'
                }
            ],
            pageSize: 2000,
            limit: Infinity
        }).load().then({
            success: this._onIterationsLoaded,
            scope: this
        });
    },

    _onIterationsLoaded: function(records) {
        var iterations = _.groupBy(records, function(record) {
            return record.get('Name') + '-' + 
                Rally.util.DateTime.formatDate(record.get('StartDate')) + '-' +
                Rally.util.DateTime.formatDate(record.get('EndDate'));
            }),
            modelNames = ['portfolioitem/feature'],
            context = this.getContext();

        this.add({
            xtype: 'rallygridboard',
            context: context,
            modelNames: modelNames,
            toggleState: 'board',
            stateful: false,
            plugins: [
                {
                    ptype: 'rallygridboardinlinefiltercontrol',
                    inlineFilterButtonConfig: {
                        stateful: true,
                        stateId: context.getScopedStateId('filters'),
                        modelNames: modelNames,
                        inlineFilterPanelConfig: {
                            quickFilterPanelConfig: {
                                defaultFields: [
                                    'ArtifactSearch'
                                ]
                            }
                        }
                    }
                }
            ],
            cardBoardConfig: {
                readOnly: true,
                cardConfig: {
                    editable: false,
                    showPlusIcon: false,
                    showColorIcon: false,
                    showBlockedIcon: false,
                    showReadyIcon: false
                },
                rowConfig: {
                    field: 'Project'
                },
                columns: _.map(iterations, function(likeIterations) {
                    return {
                        xtype: 'iterationcolumn',
                        iterations: likeIterations
                    };
                }),
                attribute: 'Release'
            }
        });
    }
});